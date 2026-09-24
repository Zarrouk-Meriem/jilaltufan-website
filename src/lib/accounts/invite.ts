import { randomBytes } from 'node:crypto'
import type { Payload, PayloadRequest, Where } from 'payload'
import { accountInviteEmail } from '@/lib/email/templates'
import { SITE_URL } from '@/lib/site'
import type { Account, Application } from '@/payload-types'

export type AccountLocale = 'ar' | 'en'

/**
 * Set on the `create` that `inviteAccount` makes, so the accounts' own "opened by hand"
 * hook knows the system is already writing the letter (acceptance, a guest's invite) and
 * does not send a second one.
 */
export const SYSTEM_INVITE = 'systemInvite'

/** Where an invite or a reset lands: our own page, in the person's language. */
export const setPasswordUrl = (token: string, locale: AccountLocale): string =>
  `${SITE_URL}/${locale}/account/set-password?token=${encodeURIComponent(token)}`

/**
 * A password nobody has ever seen or typed. An auth collection insists on one, and the
 * person replaces it from their invite before they can sign in at all — so it exists only
 * to be thrown away, and it is never written down or sent anywhere.
 */
const unknowablePassword = () => randomBytes(32).toString('base64url')

/**
 * The invite link for an account: Payload's own forgot-password token, which
 * `resetPassword` consumes once. `disableEmail` because the letter is ours — Payload's
 * default would send its own, in its own words and its own language.
 */
export async function mintInviteToken(
  payload: Payload,
  email: string,
  req?: Partial<PayloadRequest>,
): Promise<string | null> {
  return payload.forgotPassword({
    collection: 'accounts',
    data: { email },
    disableEmail: true,
    req,
  })
}

/**
 * The account for a person, created if this is the first time, and the link that activates
 * it.
 *
 * Idempotent on purpose: the acceptance hook can run again (staff correct a status, then
 * set it back) and a guest can be invited more than once, and a second account for the same
 * person would be a second identity. It matches on what the account points at first and on
 * the address second, so someone who already has an account keeps the one they have.
 *
 * `inviteUrl` is null when no invite is due: the person has already chosen a password, and
 * a reset link they did not ask for is an invitation for someone else to use it.
 */
export async function inviteAccount(
  payload: Payload,
  args: {
    email: string
    kind: NonNullable<Account['kind']>
    name?: string | null
    locale: AccountLocale
    application?: number
    instructor?: number
    req?: Partial<PayloadRequest>
  },
): Promise<{ account: Account; inviteUrl: string | null }> {
  const { email: raw, kind, name, locale, application, instructor, req } = args
  const email = raw.toLowerCase().trim()

  const owner: Where | null = application
    ? { application: { equals: application } }
    : instructor
      ? { instructor: { equals: instructor } }
      : null

  const existing = await payload.find({
    collection: 'accounts',
    where: { or: [...(owner ? [owner] : []), { email: { equals: email } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })

  const account =
    existing.docs[0] ??
    (await payload.create({
      collection: 'accounts',
      overrideAccess: true,
      req,
      context: { [SYSTEM_INVITE]: true },
      data: {
        email,
        password: unknowablePassword(),
        kind,
        name: name ?? undefined,
        locale,
        application,
        instructor,
      },
    }))

  if (account.passwordSetAt) return { account, inviteUrl: null }

  const token = await mintInviteToken(payload, account.email, req)
  if (!token) return { account, inviteUrl: null }

  await payload.update({
    collection: 'accounts',
    id: account.id,
    data: { inviteSentAt: new Date().toISOString() },
    overrideAccess: true,
    req,
  })
  return { account, inviteUrl: setPasswordUrl(token, locale) }
}

/** The account behind an accepted application; the student half of `inviteAccount`. */
export async function inviteStudentAccount(
  payload: Payload,
  application: Application,
  req?: Partial<PayloadRequest>,
): Promise<{ account: Account; inviteUrl: string | null }> {
  return inviteAccount(payload, {
    email: application.email,
    kind: 'student',
    name: application.fullName,
    locale: application.locale === 'en' ? 'en' : 'ar',
    application: application.id,
    req,
  })
}

/**
 * Mails the activation link to an account that has not chosen a password yet, and stamps
 * the send. Used when staff re-send an invite and when they open an account by hand.
 * Returns whether a letter went out (false when the person already has a password: a
 * link they did not ask for would only be an invitation for someone else).
 */
export async function sendAccountInvite(
  payload: Payload,
  account: Account,
  req?: Partial<PayloadRequest>,
): Promise<boolean> {
  if (account.passwordSetAt || account.disabled) return false
  const token = await mintInviteToken(payload, account.email, req)
  if (!token) return false
  const lang: AccountLocale = account.locale === 'en' ? 'en' : 'ar'
  const letter = accountInviteEmail(
    lang,
    account.name || account.email,
    setPasswordUrl(token, lang),
  )
  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0, req })
  await payload.sendEmail({
    to: account.email,
    replyTo: settings.applicationsEmail || settings.contactEmail,
    subject: letter.subject,
    text: letter.text,
    html: letter.html,
  })
  await payload.update({
    collection: 'accounts',
    id: account.id,
    data: { inviteSentAt: new Date().toISOString() },
    overrideAccess: true,
    req,
    context: { [SYSTEM_INVITE]: true },
  })
  return true
}
