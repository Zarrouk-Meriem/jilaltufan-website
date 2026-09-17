'use server'

import { headers } from 'next/headers'
import { ValidationError } from 'payload'
import { countryName } from '@/lib/countries'
import { academyNotification, applicantEmail, type NotificationLine } from '@/lib/email/templates'
import {
  applySchema,
  formDataToInput,
  toFieldErrors,
  type ApplyData,
  type FieldErrors,
} from '@/lib/forms/apply-schema'
import { applyLimiter, clientIp } from '@/lib/forms/rate-limit'
import { verifyTurnstile } from '@/lib/forms/turnstile'
import { getClient } from '@/lib/queries/client'
import { SITE_URL } from '@/lib/site'

export type ApplyResult =
  | { status: 'idle' }
  | { status: 'success'; email: string }
  | { status: 'error'; formError?: string; fieldErrors?: FieldErrors }

const HEAR_ABOUT_AR: Record<ApplyData['hearAbout'], string> = {
  social: 'وسائل التواصل الاجتماعي',
  friend: 'صديق أو زميل',
  organisation: 'مؤسسة أو جمعية',
  event: 'فعالية أو مخيم',
  search: 'البحث على الإنترنت',
  other: 'أخرى',
}

/** A stable, safe stored name; the original name is kept on the record. */
function storedName(original: string, mimetype: string) {
  const ext = /\.(pdf|docx?)$/i.exec(original)?.[1]?.toLowerCase()
  const byType =
    mimetype === 'application/pdf' ? 'pdf' : mimetype.includes('wordprocessingml') ? 'docx' : 'doc'
  return `cv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext ?? byType}`
}

/**
 * Public create access on Applications is closed; this action is the only
 * write path. Order matters: cheap checks first, the file and the database last.
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
    if (fieldErrors.website === 'spam') return { status: 'success', email: input.email }
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

  try {
    // The CV first: if storage rejects it, the visitor hears now and can retry, instead
    // of an application landing without the file it promised.
    let cvId: number | undefined
    if (data.cv) {
      const buffer = Buffer.from(await data.cv.arrayBuffer())
      const mimetype = data.cv.type || 'application/octet-stream'
      const file = await payload.create({
        collection: 'application-files',
        overrideAccess: true,
        data: { applicant: data.fullName, originalName: data.cv.name.slice(0, 200) },
        file: {
          data: buffer,
          mimetype,
          name: storedName(data.cv.name, mimetype),
          size: buffer.length,
        },
      })
      cvId = file.id
    }

    const doc = await payload.create({
      collection: 'applications',
      overrideAccess: true,
      data: {
        // No program at this stage: a visitor applies to the academy; staff assign the
        // program after acceptance.
        applicationStatus: 'new',
        fullName: data.fullName,
        gender: data.gender,
        dateOfBirth: `${data.dateOfBirth}T00:00:00.000Z`,
        email: data.email,
        phone: data.phone,
        nationality: data.nationality,
        country: data.country,
        profession: data.profession,
        affiliated: data.affiliated === 'yes',
        affiliationName: data.affiliated === 'yes' ? data.affiliationName || undefined : undefined,
        facebook: data.facebook || undefined,
        instagram: data.instagram || undefined,
        linkedin: data.linkedin || undefined,
        hearAbout: data.hearAbout,
        motivation: data.motivation,
        aboutYou: data.aboutYou,
        cv: cvId,
        pledge: true,
        consent: true,
        locale: data.locale,
      },
    })

    const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    // Applications have their own mailbox when the academy sets one; contact@ otherwise.
    const applicationsEmail = settings.applicationsEmail || settings.contactEmail
    const applicant = applicantEmail(data.locale, data.fullName)
    const lines: NotificationLine[] = [
      ['الاسم', data.fullName],
      ['الجنس', data.gender === 'female' ? 'أنثى' : 'ذكر'],
      ['تاريخ الميلاد', data.dateOfBirth],
      ['البريد', data.email],
      ['الهاتف', data.phone],
      ['الجنسية', countryName(data.nationality, 'ar')],
      ['بلد الإقامة', countryName(data.country, 'ar')],
      ['المهنة', data.profession],
      ['الانتماء', data.affiliated === 'yes' ? data.affiliationName || 'نعم' : 'لا'],
      ['فيسبوك', data.facebook],
      ['إنستغرام', data.instagram],
      ['لينكدإن', data.linkedin],
      ['كيف عرف عنّا', HEAR_ABOUT_AR[data.hearAbout]],
      ['لماذا يريد الالتحاق', data.motivation],
      ['عن نفسه', data.aboutYou],
      ['اللغة', data.locale],
    ]
    const notify = academyNotification({
      fullName: data.fullName,
      lines,
      cvUrl: cvId ? `${SITE_URL}/admin/collections/application-files/${cvId}` : undefined,
      adminUrl: `${SITE_URL}/admin/collections/applications/${doc.id}`,
    })
    // Emails must not fail the submission — the record is what matters; failures are logged.
    await Promise.allSettled([
      // The sender is a no-reply mailbox; replies must still reach a person.
      payload.sendEmail({
        to: data.email,
        replyTo: applicationsEmail,
        subject: applicant.subject,
        text: applicant.text,
        html: applicant.html,
      }),
      payload.sendEmail({
        to: applicationsEmail,
        replyTo: data.email,
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

    return { status: 'success', email: data.email }
  } catch (err) {
    // Payload inspects the bytes, not just the name: a damaged or mislabelled CV is the
    // visitor's to fix, so it lands under the field rather than as a generic failure.
    if (err instanceof ValidationError && err.data?.errors?.some((e) => e.path === 'file'))
      return { status: 'error', formError: 'formInvalid', fieldErrors: { cv: 'cvType' } }
    payload.logger.error({ msg: 'application create failed', err })
    return { status: 'error', formError: 'server' }
  }
}
