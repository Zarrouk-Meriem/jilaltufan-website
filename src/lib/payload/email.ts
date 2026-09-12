import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { resendAdapter } from '@payloadcms/email-resend'
import type { EmailAdapter } from 'payload'

const from = {
  defaultFromAddress: process.env.EMAIL_FROM_ADDRESS ?? 'no-reply@jilaltufan.org',
  defaultFromName: process.env.EMAIL_FROM_NAME ?? 'أكاديمية جيل الطوفان',
}

/** Links inside a message, so a password-reset URL is copyable straight from the log. */
export function linksIn(message: Record<string, unknown>): string[] {
  const body = `${String(message['text'] ?? '')}\n${String(message['html'] ?? '')}`
  return [...new Set(body.match(/https?:\/\/[^\s"'<>]+/g) ?? [])]
}

/**
 * No provider configured: print every email to the console instead of dropping it.
 * Payload's built-in fallback only logs "Email attempted" with the subject, which hides
 * password-reset links during development. Production must configure a provider.
 */
export const consoleAdapter: EmailAdapter<void> = () => ({
  name: 'console',
  ...from,
  sendEmail: async (message) => {
    const to = Array.isArray(message.to) ? message.to.join(', ') : String(message.to ?? '')
    const lines = [
      `── email (not sent: EMAIL_PROVIDER is unset) ──`,
      `to:      ${to}`,
      `subject: ${message.subject ?? ''}`,
      ...linksIn(message).map((u) => `link:    ${u}`),
      `──`,
    ]
    console.info(lines.join('\n'))
  },
})

/**
 * Env-driven email adapter. `resend` | `smtp` | unset.
 * Unset → the console adapter above (dev behaviour); nothing is delivered.
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
  if (process.env.NODE_ENV === 'production')
    console.warn('EMAIL_PROVIDER is unset — application and contact emails will not be delivered.')
  return consoleAdapter
}
