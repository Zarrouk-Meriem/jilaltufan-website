import { describe, expect, it } from 'vitest'
import { applySchema, formDataToInput, toFieldErrors } from '@/lib/forms/apply-schema'
import { createRateLimiter } from '@/lib/forms/rate-limit'
import { academyNotification, applicantEmail } from '@/lib/email/templates'

const valid = {
  program: 'palestine-our-compass',
  fullName: 'اسم تجريبي',
  email: 'a@example.com',
  phone: '',
  country: 'تونس',
  city: '',
  ageRange: '18-24',
  motivation: 'أريد الالتحاق لأنني أبحث عن مسار تربوي ومعرفي جاد.',
  hearAbout: '',
  consent: true,
  locale: 'ar',
  website: '',
} as const

describe('applySchema', () => {
  it('accepts a valid submission', () => expect(applySchema.safeParse(valid).success).toBe(true))
  it('reports message keys per field', () => {
    const r = applySchema.safeParse({
      ...valid,
      fullName: '',
      email: 'nope',
      motivation: 'short',
      consent: false,
    })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(toFieldErrors(r.error)).toEqual({
        fullName: 'required',
        email: 'email',
        motivation: 'motivationShort',
        consent: 'consent',
      })
  })
  it('rejects a filled honeypot', () => {
    const r = applySchema.safeParse({ ...valid, website: 'http://spam' })
    expect(r.success).toBe(false)
    if (!r.success) expect(toFieldErrors(r.error).website).toBe('spam')
  })
  it('parses FormData including the consent checkbox', () => {
    const fd = new FormData()
    for (const [k, v] of Object.entries({ ...valid, consent: 'on' })) fd.set(k, String(v))
    const input = formDataToInput(fd)
    expect(input.consent).toBe(true)
    expect(applySchema.safeParse(input).success).toBe(true)
  })
})

describe('rate limiter', () => {
  it('allows the capacity then blocks, and refills over time', () => {
    const rl = createRateLimiter({ capacity: 3, refillPerMs: 3 / 60_000 })
    const t0 = 1_000_000
    expect(rl.check('1.2.3.4', t0).ok).toBe(true)
    expect(rl.check('1.2.3.4', t0).ok).toBe(true)
    expect(rl.check('1.2.3.4', t0).ok).toBe(true)
    const blocked = rl.check('1.2.3.4', t0)
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfterMs).toBeGreaterThan(0)
    expect(rl.check('5.6.7.8', t0).ok).toBe(true) // other IP unaffected
    expect(rl.check('1.2.3.4', t0 + 60_000).ok).toBe(true) // refilled
  })
})

describe('emails', () => {
  it('applicant email wording follows the registration mode and locale', () => {
    expect(applicantEmail('ar', 'open', 'سارة', 'قادة الغد').subject).toContain('تم تسجيلك')
    expect(applicantEmail('ar', 'application', 'سارة', 'قادة الغد').subject).toContain(
      'استلمنا طلبك',
    )
    expect(applicantEmail('en', 'application', 'Sara', 'Leaders').text).toContain('review it')
    expect(applicantEmail('en', 'open', 'Sara', 'Leaders').html).toContain('dir="ltr"')
  })
  it('academy notification escapes HTML', () => {
    const n = academyNotification({
      program: 'p',
      fullName: '<b>x</b>',
      email: 'e',
      country: 'c',
      ageRange: '18-24',
      motivation: 'm',
      locale: 'ar',
      adminUrl: 'u',
    })
    expect(n.html).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(n.text).toContain('<b>x</b>')
  })
})
