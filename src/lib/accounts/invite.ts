import { randomBytes } from 'node:crypto'
import type { Payload, PayloadRequest } from 'payload'
import { SITE_URL } from '@/lib/site'
import type { Account, Application } from '@/payload-types'

export type AccountLocale = 'ar' | 'en'

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
 * The account behind an accepted application, created if this is the first time.
 *
 * Idempotent on purpose: the acceptance hook can run again (staff correct a status, then
 * set it back), and a second account for the same person would be a second identity. It
 * matches on the application first and on the address second, so an applicant who already
 * has an account — a returning student, someone invited by hand — keeps the one they have.
 *
 * Returns the link the letter should carry, or null when no invite is due: the person has
 * already chosen a password, and sending a reset link they did not ask for is an invitation
 * for someone else to use it.
 */
export async function inviteStudentAccount(
  payload: Payload,
  application: Application,
  req?: Partial<PayloadRequest>,
): Promise<{ account: Account; inviteUrl: string | null }> {
  const locale: AccountLocale = application.locale === 'en' ? 'en' : 'ar'
  const email = application.email.toLowerCase().trim()

  const existing = await payload.find({
    collection: 'accounts',
    where: {
      or: [{ application: { equals: application.id } }, { email: { equals: email } }],
    },
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
      data: {
        email,
        password: unknowablePassword(),
        kind: 'student',
        name: application.fullName,
        locale,
        application: application.id,
      },
    }))

  // Already activated: they sign in, or ask for a reset themselves.
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
