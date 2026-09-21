import type { CollectionAfterChangeHook, Payload } from 'payload'
import { acceptanceEmail } from '@/lib/email/templates'
import type { Application } from '@/payload-types'

/** Set on the stamping update so the hook does not run again for its own write. */
export const ACCEPTANCE_STAMP = 'acceptanceEmailStamp'

/**
 * Emails the applicant, in their own language, the moment staff move the application to
 * «accepted» — and only on that transition, so re-saving an accepted record sends nothing.
 * The send is awaited (a serverless function ends with the response, so a dangling promise
 * would be killed) and its time is recorded on the record, where staff can see it.
 * A failed send is logged and leaves the status change intact; the field stays empty.
 */
export const sendAcceptanceEmail: CollectionAfterChangeHook<Application> = async ({
  doc,
  previousDoc,
  req,
  context,
}) => {
  if (context[ACCEPTANCE_STAMP]) return doc
  if (doc.applicationStatus !== 'accepted') return doc
  if (previousDoc?.applicationStatus === 'accepted') return doc

  const { payload } = req
  const locale = doc.locale === 'en' ? 'en' : 'ar'
  const [program, settings] = await Promise.all([
    programTitle(payload, doc.program, locale),
    payload.findGlobal({ slug: 'site-settings', depth: 0 }),
  ])
  const mail = acceptanceEmail(locale, doc.fullName, program)
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
    payload.logger.error({ msg: 'acceptance email failed', id: doc.id, to: doc.email, err })
    return doc
  }

  const acceptanceEmailSentAt = new Date().toISOString()
  await payload.update({
    collection: 'applications',
    id: doc.id,
    data: { acceptanceEmailSentAt },
    context: { [ACCEPTANCE_STAMP]: true },
    overrideAccess: true,
    req,
  })
  return { ...doc, acceptanceEmailSentAt }
}

/** The program's name in the applicant's language; undefined when none is assigned or it cannot be read. */
async function programTitle(
  payload: Payload,
  program: Application['program'],
  locale: 'ar' | 'en',
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
