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
 * Print an email to the console instead of sending it, saying why it was not sent.
 * Payload's built-in fallback only logs "Email attempted" with the subject, which hides
 * password-reset links during development.
 */
const logAdapter =
  (reason: string): EmailAdapter<void> =>
  () => ({
    name: 'console',
    ...from,
    sendEmail: async (message) => {
      const to = Array.isArray(message.to) ? message.to.join(', ') : String(message.to ?? '')
      const lines = [
        `── email (not sent: ${reason}) ──`,
        `to:      ${to}`,
        ...(message.replyTo ? [`reply-to: ${recipientsOf(message.replyTo).join(', ')}`] : []),
        `subject: ${message.subject ?? ''}`,
        ...linksIn(message).map((u) => `link:    ${u}`),
        `──`,
      ]
      console.info(lines.join('\n'))
    },
  })

/** No provider configured: every email goes to the console. Production must configure one. */
export const consoleAdapter = logAdapter('EMAIL_PROVIDER is unset')

/** A provider is configured, but the message concerns a test address (below). */
const reservedLog = logAdapter('test address, reserved domain')

/**
 * Names reserved by RFC 2606 and RFC 6761: they are guaranteed to belong to nobody, so
 * anything addressed to one can only bounce.
 */
const RESERVED_RECIPIENT =
  /@(?:[^@\s]*\.)?(?:example\.(?:com|net|org)|(?:test|invalid|localhost))$/i

const recipientsOf = (to: unknown): string[] =>
  (Array.isArray(to) ? to : [to])
    .flatMap((v) =>
      typeof v === 'string'
        ? [v]
        : typeof v === 'object' && v && 'address' in v
          ? [String((v as { address: unknown }).address)]
          : [],
    )
    .filter(Boolean)

const concernsNobody = (addresses: string[]) =>
  addresses.length > 0 && addresses.every((a) => RESERVED_RECIPIENT.test(a))

/**
 * Anything addressed to a reserved name is written to the log instead of sent — and so is
 * anything whose reply-to is one: the academy's copy of an application or a contact message
 * goes to a real mailbox but replies to the visitor, so for a test visitor it is a
 * notification about nobody. The recipient check alone let those through, and a local e2e
 * run sent a dozen «طلب التحاق جديد — Playwright…» to applications@ (2026-09-24).
 *
 * The e2e suite applies as `playwright-…@example.com` and then drives the flows that write
 * to an applicant, so a provider configured locally would deliver a bounce per run — which
 * is exactly what happened: the mail host began refusing our messages for unusual sending
 * activity (2026-09-23). Those addresses belong to nobody by definition, so not sending is
 * not a workaround; it is the only correct thing to do with them, in any environment.
 */
export function withoutReservedRecipients(
  adapter: EmailAdapter | Promise<EmailAdapter>,
): EmailAdapter {
  return (args) => {
    const log = reservedLog(args)
    // The provider's factory may be a promise (nodemailer verifies its transport), so it is
    // resolved on the first real send rather than at config time.
    let inner: ReturnType<EmailAdapter> | undefined
    const provider = async () => (inner ??= (await adapter)(args))
    return {
      ...from,
      name: 'guarded',
      sendEmail: async (message) => {
        if (
          concernsNobody(recipientsOf(message.to)) ||
          concernsNobody(recipientsOf(message.replyTo))
        )
          return log.sendEmail(message)
        return (await provider()).sendEmail(message)
      },
    }
  }
}

/**
 * Env-driven email adapter. `resend` | `smtp` | unset.
 * Unset → the console adapter above (dev behaviour); nothing is delivered.
 */
export function emailAdapter() {
  const provider = process.env.EMAIL_PROVIDER
  if (provider === 'resend' && process.env.RESEND_API_KEY) {
    return withoutReservedRecipients(resendAdapter({ ...from, apiKey: process.env.RESEND_API_KEY }))
  }
  if (provider === 'smtp' && process.env.SMTP_HOST) {
    return withoutReservedRecipients(
      nodemailerAdapter({
        ...from,
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT ?? 587),
          secure: Number(process.env.SMTP_PORT ?? 587) === 465,
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
        },
      }),
    )
  }
  if (process.env.NODE_ENV === 'production')
    console.warn('EMAIL_PROVIDER is unset — application and contact emails will not be delivered.')
  return consoleAdapter
}
