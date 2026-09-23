import { z } from 'zod'

/**
 * The three account forms. Shared by the server actions and the client, so a rule is
 * written once. Error values are message keys, not sentences — the page reads them from
 * `messages/*.json` in the visitor's language.
 */

/**
 * Twelve characters, nothing else. Length is what makes a password hard to guess; a
 * composition rule ("one capital, one digit") mostly teaches people to write `Password1!`
 * and to reuse it. The top of the range is here because bcrypt silently ignores anything
 * past 72 bytes — better to refuse than to accept a password whose tail does nothing.
 */
export const passwordField = z.string().min(12, 'passwordShort').max(72, 'passwordLong')

export const signInSchema = z.object({
  email: z.email('email').max(200, 'tooLong'),
  password: z.string().min(1, 'required').max(72, 'tooLong'),
  website: z.string().max(0, 'spam').optional().or(z.literal('')),
})

export const forgotSchema = z.object({
  email: z.email('email').max(200, 'tooLong'),
  website: z.string().max(0, 'spam').optional().or(z.literal('')),
})

export const setPasswordSchema = z
  .object({
    token: z.string().min(1, 'required').max(256, 'tooLong'),
    password: passwordField,
    confirm: z.string(),
    website: z.string().max(0, 'spam').optional().or(z.literal('')),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'passwordMismatch' })

export type SignInInput = z.input<typeof signInSchema>
export type ForgotInput = z.input<typeof forgotSchema>
export type SetPasswordInput = z.input<typeof setPasswordSchema>

const str = (fd: FormData, k: string) =>
  typeof fd.get(k) === 'string' ? (fd.get(k) as string) : ''

export const signInFormData = (fd: FormData): SignInInput => ({
  email: str(fd, 'email'),
  password: str(fd, 'password'),
  website: str(fd, 'website'),
})

export const forgotFormData = (fd: FormData): ForgotInput => ({
  email: str(fd, 'email'),
  website: str(fd, 'website'),
})

export const setPasswordFormData = (fd: FormData): SetPasswordInput => ({
  token: str(fd, 'token'),
  password: str(fd, 'password'),
  confirm: str(fd, 'confirm'),
  website: str(fd, 'website'),
})

/** First error per field, as message keys. */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!out[key]) out[key] = issue.message
  }
  return out
}
