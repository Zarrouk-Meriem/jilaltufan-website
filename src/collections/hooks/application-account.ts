import type { CollectionAfterChangeHook, CollectionBeforeChangeHook } from 'payload'
import { ValidationError } from 'payload'
import { inviteStudentAccount, sendAccountInvite } from '@/lib/accounts/invite'
import { SKIP_ACTIVITY } from '@/lib/payload/activity'
import type { Application } from '@/payload-types'

/** Set on the hook's own follow-up write (clearing «أعد إرسال الدعوة»). */
const FOLLOW_UP = 'applicationAccountFollowUp'

/**
 * A corrected address must not collide with another person's account: the account is the
 * person's identity, and two people sharing one address would share one sign-in.
 */
export const guardEmailChange: CollectionBeforeChangeHook<Application> = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  // Updates only: on create Payload passes an empty `originalDoc` (no id), and a public
  // application must never be refused here — a query on `NaN` broke every submission
  // until account.spec caught it (2026-09-24).
  if (operation !== 'update' || !originalDoc?.id) return data
  const email = data.email?.toLowerCase().trim()
  if (!email || email === originalDoc.email?.toLowerCase().trim()) return data
  const clash = await req.payload.find({
    collection: 'accounts',
    where: {
      and: [{ email: { equals: email } }, { application: { not_equals: originalDoc.id } }],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })
  if (clash.docs.length)
    throw new ValidationError({
      collection: 'applications',
      req,
      errors: [
        {
          path: 'email',
          message:
            req.i18n?.language === 'en'
              ? 'Another account already uses this address.'
              : 'هذا البريد مستعمل في حساب آخر.',
        },
      ],
    })
  return data
}

/**
 * What follows on the account when staff save an application:
 *
 *   - the address was corrected → the account's address follows, so the invite, the
 *     letters and the sign-in all go to the corrected one (until 2026-09-24 a corrected
 *     address reached only the letters, and the account kept the old one);
 *   - «أعد إرسال الدعوة» was ticked → the activation link goes out again (opening the
 *     account first if acceptance had not), then the box clears itself.
 */
export const applicationAccountFollowUps: CollectionAfterChangeHook<Application> = async ({
  doc,
  previousDoc,
  operation,
  req,
  context,
}) => {
  if (context[FOLLOW_UP]) return doc
  const payload = req.payload

  // The address follows only on an update: a new application has no account yet.
  const email = doc.email?.toLowerCase().trim()
  if (operation === 'update' && email && email !== previousDoc?.email?.toLowerCase().trim()) {
    const linked = await payload.find({
      collection: 'accounts',
      where: { application: { equals: doc.id } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
    const account = linked.docs[0]
    if (account && account.email !== email)
      await payload.update({
        collection: 'accounts',
        id: account.id,
        data: { email },
        overrideAccess: true,
        req,
      })
  }

  if (doc.resendInvite) {
    try {
      if (doc.applicationStatus === 'accepted') {
        const { account } = await inviteStudentAccount(payload, doc, req)
        await sendAccountInvite(payload, account, req)
      }
    } catch (err) {
      payload.logger.error({ msg: 'invite re-send failed', application: doc.id, err })
    }
    await payload.update({
      collection: 'applications',
      id: doc.id,
      data: { resendInvite: false },
      overrideAccess: true,
      req,
      context: { [FOLLOW_UP]: true, [SKIP_ACTIVITY]: true },
    })
    return { ...doc, resendInvite: false }
  }
  return doc
}
