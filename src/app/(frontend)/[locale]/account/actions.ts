'use server'

import { revalidatePath } from 'next/cache'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { APIError } from 'payload'
import { mintInviteToken, setPasswordUrl, type AccountLocale } from '@/lib/accounts/invite'
import { getAccount, authCookieName } from '@/lib/auth/account'
import { passwordResetEmail } from '@/lib/email/templates'
import {
  changePasswordFormData,
  changePasswordSchema,
  fieldErrorsOf,
  forgotFormData,
  forgotSchema,
  setPasswordFormData,
  setPasswordSchema,
  profileFormData,
  profileSchema,
  signInFormData,
  signInSchema,
} from '@/lib/forms/account-schema'
import { sessionFileSchema } from '@/lib/forms/session-file-schema'
import { clientIp, resetLimiter, signInLimiter, uploadLimiter } from '@/lib/forms/rate-limit'
import { getClient } from '@/lib/queries/client'

export type FormState = {
  status: 'idle' | 'error' | 'done'
  formError?: string
  fieldErrors?: Record<string, string>
}

const error = (formError: string, fieldErrors?: Record<string, string>): FormState => ({
  status: 'error',
  formError,
  fieldErrors,
})

const localeOf = (v: FormDataEntryValue | null): AccountLocale => (v === 'en' ? 'en' : 'ar')

/** Payload's own cookie, set exactly as its login route would. */
async function setAuthCookie(token: string, seconds: number) {
  const store = await cookies()
  store.set(await authCookieName(), token, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: seconds,
  })
}

export async function signIn(_prev: FormState, fd: FormData): Promise<FormState> {
  const locale = localeOf(fd.get('locale'))
  const parsed = signInSchema.safeParse(signInFormData(fd))
  if (!parsed.success) {
    const fieldErrors = fieldErrorsOf(parsed.error)
    // Honeypot filled: a bot learns nothing from a refusal, so it hears the same wrong
    // credentials as anyone else.
    if (fieldErrors.website === 'spam') return error('credentials')
    return error('formInvalid', fieldErrors)
  }
  if (!signInLimiter.check(clientIp(await headers())).ok) return error('rateLimited')

  const payload = await getClient()
  try {
    const { token, exp } = await payload.login({
      collection: 'accounts',
      data: { email: parsed.data.email, password: parsed.data.password },
    })
    if (!token) return error('credentials')
    await setAuthCookie(token, exp ? Math.max(0, exp - Math.floor(Date.now() / 1000)) : 60 * 60)
  } catch (err) {
    // A locked account is worth saying out loud — the person is being told why waiting
    // helps. Everything else is one answer, so the form cannot be used to discover which
    // addresses have accounts.
    if (err instanceof APIError && err.status === 401 && /locked/i.test(err.message))
      return error('locked')
    return error('credentials')
  }
  redirect(`/${locale}/account`)
}

export async function signOut(locale: AccountLocale) {
  const store = await cookies()
  store.delete(await authCookieName())
  redirect(`/${locale}/account/sign-in`)
}

/**
 * A reset link. The answer is the same for every address — sent, always — so the form
 * never reveals which addresses have accounts.
 */
export async function requestReset(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = forgotSchema.safeParse(forgotFormData(fd))
  if (!parsed.success) {
    const fieldErrors = fieldErrorsOf(parsed.error)
    if (fieldErrors.website === 'spam') return { status: 'done' }
    return error('formInvalid', fieldErrors)
  }
  if (!resetLimiter.check(clientIp(await headers())).ok) return error('rateLimited')

  const payload = await getClient()
  const email = parsed.data.email.toLowerCase().trim()
  try {
    const { docs } = await payload.find({
      collection: 'accounts',
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const account = docs[0]
    if (account) {
      const token = await mintInviteToken(payload, email)
      if (token) {
        const lang: AccountLocale = account.locale === 'en' ? 'en' : 'ar'
        const letter = passwordResetEmail(lang, account.name || email, setPasswordUrl(token, lang))
        const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
        await payload.sendEmail({
          to: email,
          replyTo: settings.applicationsEmail || settings.contactEmail,
          subject: letter.subject,
          text: letter.text,
          html: letter.html,
        })
      }
    }
  } catch (err) {
    // Logged, not surfaced: the page must answer the same way whatever happened here.
    payload.logger.error({ msg: 'password reset failed', err })
  }
  return { status: 'done' }
}

/** The end of an invite or a reset: the person chooses their own password and is signed in. */
export async function setPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const locale = localeOf(fd.get('locale'))
  const parsed = setPasswordSchema.safeParse(setPasswordFormData(fd))
  if (!parsed.success) {
    const fieldErrors = fieldErrorsOf(parsed.error)
    if (fieldErrors.website === 'spam') return error('tokenInvalid')
    return error('formInvalid', fieldErrors)
  }
  if (!signInLimiter.check(clientIp(await headers())).ok) return error('rateLimited')

  const payload = await getClient()
  try {
    const { token, user } = await payload.resetPassword({
      collection: 'accounts',
      data: { token: parsed.data.token, password: parsed.data.password },
      overrideAccess: true,
    })
    // Stamped so staff can see who has activated, and so an invite is never re-sent to
    // someone who already has a password.
    await payload.update({
      collection: 'accounts',
      id: user.id as number,
      data: { passwordSetAt: new Date().toISOString() },
      overrideAccess: true,
    })
    if (token) await setAuthCookie(token, 60 * 60 * 24 * 7)
  } catch {
    // Payload gives one error for expired, spent, and invented tokens alike, and so do we:
    // the page offers a new link either way.
    return error('tokenInvalid')
  }
  redirect(`/${locale}/account`)
}

/** The student's own name and the language we write to them in. */
export async function updateProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const account = await getAccount()
  if (!account) return error('signedOut')
  const parsed = profileSchema.safeParse(profileFormData(fd))
  if (!parsed.success) return error('formInvalid', fieldErrorsOf(parsed.error))

  const payload = await getClient()
  try {
    await payload.update({
      collection: 'accounts',
      id: account.id,
      data: { name: parsed.data.name, locale: parsed.data.locale },
      overrideAccess: true,
    })
  } catch (err) {
    payload.logger.error({ msg: 'profile update failed', id: account.id, err })
    return error('server')
  }
  revalidatePath(`/${localeOf(fd.get('locale'))}/account/profile`)
  return { status: 'done' }
}

/**
 * A new password, for someone already signed in. The current one is asked for and checked
 * by signing in with it — an unlocked screen should not be enough to take an account over.
 */
export async function changePassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const account = await getAccount()
  if (!account) return error('signedOut')
  const parsed = changePasswordSchema.safeParse(changePasswordFormData(fd))
  if (!parsed.success) return error('formInvalid', fieldErrorsOf(parsed.error))
  if (!signInLimiter.check(clientIp(await headers())).ok) return error('rateLimited')

  const payload = await getClient()
  try {
    await payload.login({
      collection: 'accounts',
      data: { email: account.email, password: parsed.data.current },
    })
  } catch {
    return error('formInvalid', { current: 'wrongPassword' })
  }

  try {
    await payload.update({
      collection: 'accounts',
      id: account.id,
      data: { password: parsed.data.password, passwordSetAt: new Date().toISOString() },
      overrideAccess: true,
    })
  } catch (err) {
    payload.logger.error({ msg: 'password change failed', id: account.id, err })
    return error('server')
  }
  return { status: 'done' }
}

/**
 * A file a guest instructor sends for one of their sessions.
 *
 * It lands in `session-files`, which students cannot read: staff review it and publish it
 * as a material if it should be seen. The session is checked against the ones this guest is
 * actually teaching, so an id typed into the form cannot attach a file to someone else's.
 */
export async function sendSessionFile(_prev: FormState, fd: FormData): Promise<FormState> {
  const account = await getAccount()
  if (!account || account.kind !== 'instructor') return error('signedOut')

  const file = fd.get('file')
  const parsed = sessionFileSchema.safeParse({
    session: fd.get('session'),
    note: typeof fd.get('note') === 'string' ? fd.get('note') : '',
    file: file instanceof File ? file : undefined,
  })
  if (!parsed.success) return error('formInvalid', fieldErrorsOf(parsed.error))
  if (!uploadLimiter.check(clientIp(await headers())).ok) return error('rateLimited')

  const payload = await getClient()
  try {
    const instructorId =
      typeof account.instructor === 'object' && account.instructor
        ? account.instructor.id
        : account.instructor
    if (!instructorId) return error('server')

    // Theirs to teach, or nothing happens.
    const { totalDocs } = await payload.count({
      collection: 'sessions',
      where: {
        and: [{ id: { equals: parsed.data.session } }, { instructors: { contains: instructorId } }],
      },
      overrideAccess: true,
    })
    if (totalDocs === 0) return error('notYourSession')

    const buffer = Buffer.from(await parsed.data.file.arrayBuffer())
    await payload.create({
      collection: 'session-files',
      overrideAccess: true,
      data: {
        session: parsed.data.session,
        sender: account.id,
        originalName: parsed.data.file.name.slice(0, 200),
        note: parsed.data.note || undefined,
      },
      file: {
        data: buffer,
        mimetype: parsed.data.file.type || 'application/octet-stream',
        name: `session-${parsed.data.session}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extensionOf(parsed.data.file.name)}`,
        size: buffer.length,
      },
    })
  } catch (err) {
    payload.logger.error({ msg: 'session file upload failed', account: account.id, err })
    return error('server')
  }
  revalidatePath(`/${localeOf(fd.get('locale'))}/account`)
  return { status: 'done' }
}

/** A stable extension for the stored name; the original name is kept on the record. */
const extensionOf = (name: string) => /\.(pdf|docx?|pptx?)$/i.exec(name)?.[0]?.toLowerCase() ?? ''
