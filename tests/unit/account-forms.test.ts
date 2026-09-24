import { describe, expect, it } from 'vitest'
import { acceptanceEmail, passwordResetEmail } from '@/lib/email/templates'
import {
  fieldErrorsOf,
  setPasswordSchema,
  signInSchema,
  forgotSchema,
} from '@/lib/forms/account-schema'

const errorsOf = (r: { success: false; error: Parameters<typeof fieldErrorsOf>[0] }) =>
  fieldErrorsOf(r.error)

describe('signInSchema', () => {
  it('accepts an address and a password', () => {
    expect(signInSchema.safeParse({ email: 'a@b.test', password: 'x' }).success).toBe(true)
  })
  it('names the fields that are wrong, as message keys', () => {
    const r = signInSchema.safeParse({ email: 'not-an-address', password: '' })
    expect(r.success).toBe(false)
    expect(errorsOf(r as never)).toEqual({ email: 'email', password: 'required' })
  })
  it('flags a filled honeypot as spam rather than as a bad field', () => {
    const r = signInSchema.safeParse({ email: 'a@b.test', password: 'x', website: 'http://spam' })
    expect(errorsOf(r as never).website).toBe('spam')
  })
})

describe('forgotSchema', () => {
  it('asks only for an address', () => {
    expect(forgotSchema.safeParse({ email: 'a@b.test' }).success).toBe(true)
  })
})

describe('setPasswordSchema', () => {
  const ok = { token: 't', password: 'a-long-enough-one', confirm: 'a-long-enough-one' }

  it('accepts twelve characters or more', () => {
    expect(setPasswordSchema.safeParse(ok).success).toBe(true)
    expect(
      setPasswordSchema.safeParse({ ...ok, password: 'exactlytwelv', confirm: 'exactlytwelv' })
        .success,
    ).toBe(true)
  })
  it('refuses a short one, on the password field', () => {
    const r = setPasswordSchema.safeParse({ ...ok, password: 'short', confirm: 'short' })
    expect(errorsOf(r as never).password).toBe('passwordShort')
  })
  it('refuses past bcrypt’s 72 bytes rather than silently ignoring the tail', () => {
    const long = 'x'.repeat(73)
    const r = setPasswordSchema.safeParse({ ...ok, password: long, confirm: long })
    expect(errorsOf(r as never).password).toBe('passwordLong')
  })
  it('reports a mismatch under the second field, where it can be fixed', () => {
    const r = setPasswordSchema.safeParse({ ...ok, confirm: 'something-else-entirely' })
    expect(errorsOf(r as never).confirm).toBe('passwordMismatch')
  })
  it('asks for a token — a form without one cannot set anything', () => {
    const r = setPasswordSchema.safeParse({ ...ok, token: '' })
    expect(errorsOf(r as never).token).toBe('required')
  })
})

describe('the letters that open an account', () => {
  const url = 'https://jilaltufan.org/ar/account/set-password?token=abc'

  it('puts the invite in the acceptance letter, not in a second one', () => {
    const mail = acceptanceEmail('ar', 'مريم', url)
    expect(mail.html).toContain(`href="${url}"`)
    expect(mail.text).toContain('اختر كلمة السر')
    expect(mail.text).toContain('من نافذة الطالب تختار برنامجك')
  })

  it('reads as an ordinary acceptance when there is no invite to give', () => {
    const mail = acceptanceEmail('en', 'Maryam')
    expect(mail.html).not.toContain('<a href')
    expect(mail.text).not.toContain('Choose your password')
    expect(mail.text).toContain('has been accepted')
  })

  it('never says a password, in either letter', () => {
    for (const mail of [acceptanceEmail('ar', 'مريم', url), passwordResetEmail('ar', 'مريم', url)])
      expect(mail.text).not.toMatch(/كلمة السر الخاصة بك هي|your password is/i)
  })

  it('tells someone who did not ask for a reset that nothing has changed', () => {
    expect(passwordResetEmail('en', 'Maryam', url).text).toContain(
      'your current password is unchanged',
    )
    expect(passwordResetEmail('ar', 'مريم', url).text).toContain('كلمة سرك الحالية لم تتغيّر')
  })
})
