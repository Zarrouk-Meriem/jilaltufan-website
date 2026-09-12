import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { resendAdapter } from '@payloadcms/email-resend'

const from = {
  defaultFromAddress: process.env.EMAIL_FROM_ADDRESS ?? 'no-reply@jilaltufan.org',
  defaultFromName: process.env.EMAIL_FROM_NAME ?? 'أكاديمية جيل الطوفان',
}

/**
 * Env-driven email adapter. `resend` | `smtp` | unset.
 * Unset → undefined → Payload logs every email to the console (dev behaviour).
 */
export function emailAdapter() {
  const provider = process.env.EMAIL_PROVIDER
  if (provider === 'resend' && process.env.RESEND_API_KEY) {
    return resendAdapter({ ...from, apiKey: process.env.RESEND_API_KEY })
  }
  if (provider === 'smtp' && process.env.SMTP_HOST) {
    return nodemailerAdapter({
      ...from,
      transportOptions: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: Number(process.env.SMTP_PORT ?? 587) === 465,
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      },
    })
  }
  return undefined
}
