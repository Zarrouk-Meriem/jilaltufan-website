'use server'

import { headers } from 'next/headers'
import { contactFormDataToInput, contactSchema, type ContactData } from '@/lib/forms/contact-schema'
import { clientIp, contactLimiter } from '@/lib/forms/rate-limit'
import { getClient } from '@/lib/queries/client'
import { SITE_URL } from '@/lib/site'

export type ContactResult =
  | { status: 'idle' }
  | { status: 'success' }
  | {
      status: 'error'
      formError?: string
      fieldErrors?: Partial<Record<keyof ContactData, string>>
    }

/** Public create on ContactMessages is closed; this action is the only write path. */
export async function submitContact(
  _prev: ContactResult,
  formData: FormData,
): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(contactFormDataToInput(formData))
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof ContactData, string>> = {}
    for (const i of parsed.error.issues) {
      const k = i.path[0] as keyof ContactData
      if (k && !fieldErrors[k]) fieldErrors[k] = i.message
    }
    if (fieldErrors.website === 'spam') return { status: 'success' }
    return { status: 'error', formError: 'formInvalid', fieldErrors }
  }
  const data = parsed.data
  const ip = clientIp(await headers())
  if (!contactLimiter.check(ip).ok) return { status: 'error', formError: 'rateLimited' }

  const payload = await getClient()
  try {
    const doc = await payload.create({
      collection: 'contact-messages',
      overrideAccess: true,
      data: {
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        messageStatus: 'new',
        locale: data.locale,
      },
    })
    const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    const text = [
      `من: ${data.name} <${data.email}>`,
      `اللغة: ${data.locale}`,
      '',
      data.message,
      '',
      `الإدارة: ${SITE_URL}/admin/collections/contact-messages/${doc.id}`,
    ].join('\n')
    await payload
      .sendEmail({
        to: settings.contactEmail,
        replyTo: data.email,
        subject: `رسالة من الموقع: ${data.subject}`,
        text,
      })
      .catch((err: unknown) => payload.logger.error({ msg: 'contact email failed', err }))
    return { status: 'success' }
  } catch (err) {
    payload.logger.error({ msg: 'contact create failed', err })
    return { status: 'error', formError: 'server' }
  }
}
