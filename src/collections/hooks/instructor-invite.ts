import type { CollectionAfterChangeHook } from 'payload'
import { inviteAccount } from '@/lib/accounts/invite'
import { instructorInviteEmail } from '@/lib/email/templates'
import { SKIP_ACTIVITY } from '@/lib/payload/activity'
import type { Instructor } from '@/payload-types'

/** Set on the stamping update so the hook does not run again for its own write. */
export const INSTRUCTOR_INVITE_STAMP = 'instructorInviteStamp'

/**
 * «أرسل دعوة» on a guest's profile: opens their account and writes to them with the link
 * that activates it (PLAN.md §13.3). Staff tick the box and save, as with the rejection
 * letter — an invite is a message to a person, so it is never sent by a status alone.
 *
 * The box is cleared afterwards, so the same guest can be invited again later (a lost
 * letter, a new season) without a second account: `inviteAccount` matches on the profile
 * and the address before it creates one.
 */
export const inviteInstructorAccount: CollectionAfterChangeHook<Instructor> = async ({
  doc,
  req,
  context,
}) => {
  if (context[INSTRUCTOR_INVITE_STAMP]) return doc
  if (!doc.sendInvite || !doc.contactEmail) return doc

  const { payload } = req
  const locale = doc.contactLocale === 'en' ? 'en' : 'ar'

  try {
    const { inviteUrl } = await inviteAccount(payload, {
      email: doc.contactEmail,
      kind: 'instructor',
      name: doc.name,
      locale,
      instructor: doc.id,
      req,
    })
    // Already activated: they sign in, or ask for a reset themselves. Nothing is sent, and
    // the box is still cleared so the record does not look like it is waiting to fire.
    if (inviteUrl) {
      const letter = instructorInviteEmail(locale, doc.name, inviteUrl)
      const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
      await payload.sendEmail({
        to: doc.contactEmail,
        replyTo: settings.contactEmail,
        subject: letter.subject,
        text: letter.text,
        html: letter.html,
      })
    }
  } catch (err) {
    payload.logger.error({ msg: 'instructor invite failed', id: doc.id, err })
    return doc
  }

  const sentAt = new Date().toISOString()
  await payload.update({
    collection: 'instructors',
    id: doc.id,
    data: { sendInvite: false, inviteSentAt: sentAt },
    // The system's own follow-up write, not the editor's: keep it out of the activity log.
    context: { [INSTRUCTOR_INVITE_STAMP]: true, [SKIP_ACTIVITY]: true },
    overrideAccess: true,
    req,
  })
  return { ...doc, sendInvite: false, inviteSentAt: sentAt }
}
