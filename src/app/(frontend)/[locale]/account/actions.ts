'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { APIError } from 'payload'
import { mintInviteToken, setPasswordUrl, type AccountLocale } from '@/lib/accounts/invite'
import { authCookieName } from '@/lib/auth/account'
import { passwordResetEmail } from '@/lib/email/templates'
import {
  fieldErrorsOf,
  forgotFormData,
  forgotSchema,
  setPasswordFormData,
  setPasswordSchema,
  signInFormData,
  signInSchema,
} from '@/lib/forms/account-schema'
import { clientIp, resetLimiter, signInLimiter } from '@/lib/forms/rate-limit'
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
