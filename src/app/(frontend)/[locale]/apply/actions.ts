'use server'

import { headers } from 'next/headers'
import { academyNotification, applicantEmail } from '@/lib/email/templates'
import {
  applySchema,
  formDataToInput,
  toFieldErrors,
  type FieldErrors,
} from '@/lib/forms/apply-schema'
import { applyLimiter, clientIp } from '@/lib/forms/rate-limit'
import { verifyTurnstile } from '@/lib/forms/turnstile'
import { getClient } from '@/lib/queries/client'
import { SITE_URL } from '@/lib/site'

export type ApplyResult =
  | { status: 'idle' }
  | { status: 'success'; mode: 'open' | 'application'; program: string; email: string }
  | { status: 'error'; formError?: string; fieldErrors?: FieldErrors }

/**
 * Public create access on Applications is closed; this action is the only
 * write path. Order matters: cheap checks first, the database last.
 */
export async function submitApplication(
  _prev: ApplyResult,
  formData: FormData,
): Promise<ApplyResult> {
  const input = formDataToInput(formData)
  const parsed = applySchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors = toFieldErrors(parsed.error)
    // Honeypot filled: pretend success so bots learn nothing; write nothing.
    if (fieldErrors.website === 'spam')
      return { status: 'success', mode: 'application', program: '', email: input.email }
    return { status: 'error', formError: 'formInvalid', fieldErrors }
  }
  const data = parsed.data

  const h = await headers()
  const ip = clientIp(h)
  const limit = applyLimiter.check(ip)
  if (!limit.ok) return { status: 'error', formError: 'rateLimited' }
  if (!(await verifyTurnstile(data.turnstileToken, ip)))
    return { status: 'error', formError: 'turnstile' }

  const payload = await getClient()
  const program = (
    await payload.find({
      collection: 'programs',
      where: { and: [{ slug: { equals: data.program } }, { status: { equals: 'published' } }] },
      limit: 1,
      locale: data.locale,
      depth: 0,
      overrideAccess: false,
    })
  ).docs[0]
  if (!program) return { status: 'error', formError: 'programNotFound' }
  if (program.registrationMode === 'closed') return { status: 'error', formError: 'programClosed' }
  const mode: 'open' | 'application' = program.registrationMode === 'open' ? 'open' : 'application'

  try {
    const doc = await payload.create({
      collection: 'applications',
      overrideAccess: true,
      data: {
        program: program.id,
        applicationStatus: 'new',
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || undefined,
        country: data.country,
        city: data.city || undefined,
        ageRange: data.ageRange,
        motivation: data.motivation,
        hearAbout: data.hearAbout || undefined,
        consent: true,
        locale: data.locale,
      },
    })

    const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    const applicant = applicantEmail(data.locale, mode, data.fullName, program.title)
    const notify = academyNotification({
      ...data,
      program: program.title,
      adminUrl: `${SITE_URL}/admin/collections/applications/${doc.id}`,
    })
    // Emails must not fail the submission — the record is what matters; failures are logged.
    await Promise.allSettled([
      payload.sendEmail({
        to: data.email,
        subject: applicant.subject,
        text: applicant.text,
        html: applicant.html,
      }),
      payload.sendEmail({
        to: settings.contactEmail,
        subject: notify.subject,
        text: notify.text,
        html: notify.html,
      }),
    ]).then((rs) =>
      rs.forEach(
        (r) =>
          r.status === 'rejected' &&
          payload.logger.error({ msg: 'application email failed', err: r.reason }),
      ),
    )

    return { status: 'success', mode, program: program.title, email: data.email }
  } catch (err) {
    payload.logger.error({ msg: 'application create failed', err })
    return { status: 'error', formError: 'server' }
  }
}
