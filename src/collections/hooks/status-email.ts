import type { CollectionAfterChangeHook, Payload } from 'payload'
import {
  acceptanceEmail,
  rejectionEmail,
  reviewingEmail,
  waitlistEmail,
} from '@/lib/email/templates'
import { SKIP_ACTIVITY } from '@/lib/payload/activity'
import type { Application } from '@/payload-types'

/** Set on the stamping update so the hook does not run again for its own write. */
export const STATUS_EMAIL_STAMP = 'statusEmailStamp'

type Status = Application['applicationStatus']
type Locale = 'ar' | 'en'
type Mail = { subject: string; text: string; html: string }
type Stamp =
  'reviewingEmailSentAt' | 'acceptanceEmailSentAt' | 'waitlistEmailSentAt' | 'rejectionEmailSentAt'

/** Which status writes to the applicant, when, and where the send is recorded. */
const STATUS_EMAILS: Partial<
  Record<Status, { stamp: Stamp; armed: (a: Partial<Application>) => boolean }>
> = {
  // Only from «new»: going back to reviewing after a decision is a correction, not news.
  reviewing: { stamp: 'reviewingEmailSentAt', armed: (a) => a.applicationStatus === 'reviewing' },
  accepted: { stamp: 'acceptanceEmailSentAt', armed: (a) => a.applicationStatus === 'accepted' },
  waitlisted: { stamp: 'waitlistEmailSentAt', armed: (a) => a.applicationStatus === 'waitlisted' },
  // A rejection cannot be unsent, so the status alone never sends it: staff tick the box.
  rejected: {
    stamp: 'rejectionEmailSentAt',
    armed: (a) => a.applicationStatus === 'rejected' && a.sendRejectionEmail === true,
  },
}

/**
 * Writes to the applicant, in their own language, when the application's status changes:
 * reviewing (from new), accepted, waitlisted — on the transition only, so a re-save sends
 * nothing — and rejected once staff tick «send the rejection email». The send is awaited
 * (a serverless function ends with the response, so a dangling promise would be killed) and
 * its time is recorded on the record, where staff can see it. A failed send is logged and
 * leaves the status change intact; the stamp stays empty.
 */
export const sendStatusEmail: CollectionAfterChangeHook<Application> = async ({
  doc,
  previousDoc,
  req,
  context,
}) => {
  if (context[STATUS_EMAIL_STAMP]) return doc
  const rule = STATUS_EMAILS[doc.applicationStatus]
  if (!rule) return doc
  if (!rule.armed(doc) || rule.armed(previousDoc ?? {})) return doc
  if (doc.applicationStatus === 'reviewing' && previousDoc?.applicationStatus !== 'new') return doc

  const { payload } = req
  const locale: Locale = doc.locale === 'en' ? 'en' : 'ar'
  const [mail, settings] = await Promise.all([
    compose(payload, doc, locale),
    payload.findGlobal({ slug: 'site-settings', depth: 0 }),
  ])
  try {
    await payload.sendEmail({
      to: doc.email,
      // The sender is a no-reply mailbox; replies must still reach a person.
      replyTo: settings.applicationsEmail || settings.contactEmail,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    })
  } catch (err) {
    payload.logger.error({
      msg: 'status email failed',
      status: doc.applicationStatus,
      id: doc.id,
      to: doc.email,
      err,
    })
    return doc
  }

  const sentAt = new Date().toISOString()
  await payload.update({
    collection: 'applications',
    id: doc.id,
    data: { [rule.stamp]: sentAt },
    // The stamp is the system's write, not the editor's: keep it out of the activity log.
    context: { [STATUS_EMAIL_STAMP]: true, [SKIP_ACTIVITY]: true },
    overrideAccess: true,
    req,
  })
  return { ...doc, [rule.stamp]: sentAt }
}

async function compose(payload: Payload, doc: Application, locale: Locale): Promise<Mail> {
  switch (doc.applicationStatus) {
    case 'reviewing':
      return reviewingEmail(locale, doc.fullName)
    case 'accepted':
      return acceptanceEmail(locale, doc.fullName, await programTitle(payload, doc.program, locale))
    case 'waitlisted':
      return waitlistEmail(locale, doc.fullName)
    default:
      return rejectionEmail(locale, doc.fullName)
  }
}

/** The program's name in the applicant's language; undefined when none is assigned or it cannot be read. */
async function programTitle(
  payload: Payload,
  program: Application['program'],
  locale: Locale,
): Promise<string | undefined> {
  const id = typeof program === 'object' && program ? program.id : program
  if (!id) return undefined
  try {
    const doc = await payload.findByID({
      collection: 'programs',
      id,
      locale,
      depth: 0,
      overrideAccess: true,
    })
    return doc.title || undefined
  } catch {
    return undefined
  }
}
