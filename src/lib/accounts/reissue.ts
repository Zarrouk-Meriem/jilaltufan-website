import type { Payload } from 'payload'
import { freshInviteEmail } from '@/lib/email/templates'
import type { Account } from '@/payload-types'
import { mintInviteToken, setPasswordUrl, type AccountLocale } from './invite'

/**
 * Mails a fresh set-password link when `token` is an invite that expired before the person
 * ever chose a password (PLAN.md §13.1.2: the link re-issues itself). Holding the old link
 * proves the letter reached them, so the new one goes to the address already on the
 * account — never to an address typed on a page.
 *
 * Payload keeps a spent token on the row (it only moves its expiry to the moment of use),
 * so "never activated" — no `passwordSetAt` — is what separates an expired invite from a
 * used link or a password reset; those keep the ordinary "ask for a new link" answer.
 * Returns whether a letter went out. The caller rate-limits.
 */
export async function reissueExpiredInvite(
  payload: Payload,
  token: string,
  now: Date = new Date(),
): Promise<boolean> {
  try {
    const account = (await payload.db.findOne({
      collection: 'accounts',
      where: { resetPasswordToken: { equals: token } },
    })) as (Account & { resetPasswordExpiration?: string | null }) | null
    if (!account || account.passwordSetAt || account.disabled) return false
    if (!account.resetPasswordExpiration) return false
    if (new Date(account.resetPasswordExpiration).getTime() > now.getTime()) return false

    const fresh = await mintInviteToken(payload, account.email)
    if (!fresh) return false
    const lang: AccountLocale = account.locale === 'en' ? 'en' : 'ar'
    const letter = freshInviteEmail(
      lang,
      account.name || account.email,
      setPasswordUrl(fresh, lang),
    )
    const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    await payload.sendEmail({
      to: account.email,
      replyTo: settings.applicationsEmail || settings.contactEmail,
      subject: letter.subject,
      text: letter.text,
      html: letter.html,
    })
    return true
  } catch (err) {
    payload.logger.error({ msg: 'invite re-issue failed', err })
    return false
  }
}
