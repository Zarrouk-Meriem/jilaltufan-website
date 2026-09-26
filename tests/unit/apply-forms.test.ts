import { describe, expect, it } from 'vitest'
import {
  applySchema,
  CV_MAX_BYTES,
  formDataToInput,
  isAdult,
  STEP_FIELDS,
  toFieldErrors,
} from '@/lib/forms/apply-schema'
import { createRateLimiter } from '@/lib/forms/rate-limit'
import { academyNotification, applicantEmail } from '@/lib/email/templates'

const valid = {
  fullName: 'اسم تجريبي',
  gender: 'female',
  dateOfBirth: '2001-05-14',
  email: 'a@example.com',
  phone: '+216 20 000 000',
  nationality: 'TN',
  country: 'PS',
  profession: 'طالبة جامعية',
  affiliated: 'no',
  affiliationName: '',
  facebook: '',
  instagram: '',
  linkedin: '',
  hearAbout: 'friend',
  motivation: 'أريد الالتحاق لأنني أبحث عن مسار تربوي ومعرفي جاد.',
  aboutYou: 'طالبة في السنة الثالثة، مهتمة بالإعلام والعمل التطوعي.',
  cv: new File([new Uint8Array(512)], 'cv.pdf', { type: 'application/pdf' }),
  pledge: true,
  ageConfirmed: true,
  consent: true,
  locale: 'ar',
  website: '',
} as const

const pdf = (bytes: number) =>
  new File([new Uint8Array(bytes)], 'cv.pdf', { type: 'application/pdf' })

describe('applySchema', () => {
  it('accepts a valid submission', () => expect(applySchema.safeParse(valid).success).toBe(true))

  it('reports message keys per field', () => {
    const r = applySchema.safeParse({
      ...valid,
      fullName: '',
      email: 'nope',
      dateOfBirth: '2030-01-01',
      nationality: 'ZZ',
      motivation: 'short',
      aboutYou: 'short',
      pledge: false,
      consent: false,
    })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(toFieldErrors(r.error)).toEqual({
        fullName: 'required',
        email: 'email',
        dateOfBirth: 'dateOfBirth',
        nationality: 'required',
        motivation: 'motivationShort',
        aboutYou: 'aboutShort',
        pledge: 'pledge',
        consent: 'consent',
      })
  })

  it('requires the organisation name only when affiliated', () => {
    const yes = applySchema.safeParse({ ...valid, affiliated: 'yes' })
    expect(yes.success).toBe(false)
    if (!yes.success) expect(toFieldErrors(yes.error).affiliationName).toBe('required')
    expect(
      applySchema.safeParse({ ...valid, affiliated: 'yes', affiliationName: 'x' }).success,
    ).toBe(true)
  })

  it('normalises the phone and insists on a country code', () => {
    const r = applySchema.safeParse({ ...valid, phone: '+٢١٦ ٢٠ ٠٠٠ ٠٠٠' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.phone).toBe('+21620000000')
    for (const p of ['20 000 000', '+216 12', 'abc', '+216 2000000000000000']) {
      const bad = applySchema.safeParse({ ...valid, phone: p })
      expect(bad.success).toBe(false)
      if (!bad.success) expect(['phone', 'tooLong']).toContain(toFieldErrors(bad.error).phone)
    }
  })

  it('rejects an impossible or future date of birth', () => {
    for (const d of ['2001-02-30', '1900-01-01', '2099-01-01', '14/05/2001'])
      expect(applySchema.safeParse({ ...valid, dateOfBirth: d }).success).toBe(false)
  })

  it('accepts a PDF CV within the limit and rejects the rest', () => {
    expect(applySchema.safeParse({ ...valid, cv: pdf(1024) }).success).toBe(true)
    const big = applySchema.safeParse({ ...valid, cv: pdf(CV_MAX_BYTES + 1) })
    expect(big.success).toBe(false)
    if (!big.success) expect(toFieldErrors(big.error).cv).toBe('cvTooLarge')
    const png = applySchema.safeParse({
      ...valid,
      cv: new File([new Uint8Array(10)], 'me.png', { type: 'image/png' }),
    })
    expect(png.success).toBe(false)
    if (!png.success) expect(toFieldErrors(png.error).cv).toBe('cvType')
    // An untouched file input registers as an empty string: no file, and a CV is required.
    for (const none of ['', undefined]) {
      const r = applySchema.safeParse({ ...valid, cv: none })
      expect(r.success).toBe(false)
      if (!r.success) expect(toFieldErrors(r.error).cv).toBe('required')
    }
  })

  it('rejects a filled honeypot', () => {
    const r = applySchema.safeParse({ ...valid, website: 'http://spam' })
    expect(r.success).toBe(false)
    if (!r.success) expect(toFieldErrors(r.error).website).toBe('spam')
  })

  it('parses FormData including the checkboxes and the file', () => {
    const fd = new FormData()
    for (const [k, v] of Object.entries({ ...valid, pledge: 'on', consent: 'on' }))
      if (v !== undefined) fd.set(k, String(v))
    fd.set('cv', pdf(512))
    const input = formDataToInput(fd)
    expect(input.pledge).toBe(true)
    expect(input.consent).toBe(true)
    expect(input.cv).toBeInstanceOf(File)
    const r = applySchema.safeParse(input)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.cv?.name).toBe('cv.pdf')
  })

  it('every schema field the visitor fills belongs to exactly one step', () => {
    const all = STEP_FIELDS.flat()
    expect(new Set(all).size).toBe(all.length)
    const hidden = ['locale', 'website', 'turnstileToken']
    for (const k of Object.keys(valid)) if (!hidden.includes(k)) expect(all).toContain(k)
  })

  // The academy's rule (2026-09-26): 18 or older on the day of submission, no guardian route.
  it('refuses anyone under 18 on the day of submission, with its own message', () => {
    const now = new Date()
    const iso = (y: number, m: number, d: number) =>
      new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10)
    const y = now.getUTCFullYear()
    const m = now.getUTCMonth()
    const d = now.getUTCDate()
    const young = applySchema.safeParse({ ...valid, dateOfBirth: iso(y - 18, m, d + 1) })
    expect(young.success).toBe(false)
    if (!young.success) expect(toFieldErrors(young.error).dateOfBirth).toBe('underAge')
    expect(applySchema.safeParse({ ...valid, dateOfBirth: iso(y - 18, m, d) }).success).toBe(true)
  })

  it('counts a 29 February birthday from 1 March in a common year', () => {
    expect(isAdult('2008-02-29', new Date(Date.UTC(2026, 1, 28)))).toBe(false)
    expect(isAdult('2008-02-29', new Date(Date.UTC(2026, 2, 1)))).toBe(true)
  })

  it('requires the age confirmation box, like the consent', () => {
    const r = applySchema.safeParse({ ...valid, ageConfirmed: false })
    expect(r.success).toBe(false)
    if (!r.success) expect(toFieldErrors(r.error).ageConfirmed).toBe('ageConfirmed')
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
  it('applicant email says the program comes after acceptance, in the visitor locale', () => {
    expect(applicantEmail('ar', 'سارة').subject).toContain('استلمنا طلب')
    expect(applicantEmail('ar', 'سارة').text).toContain('تختار برنامجك')
    expect(applicantEmail('en', 'Sara').text).toContain('review it')
    expect(applicantEmail('en', 'Sara').html).toContain('dir="ltr"')
  })
  it('academy notification escapes HTML, drops empty answers, and links the CV', () => {
    const n = academyNotification({
      fullName: '<b>x</b>',
      lines: [
        ['الاسم', '<b>x</b>'],
        ['فيسبوك', ''],
        ['لينكدإن', undefined],
      ],
      cvUrl: 'https://example.org/admin/collections/application-files/7',
      adminUrl: 'u',
    })
    expect(n.html).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(n.text).toContain('<b>x</b>')
    expect(n.text).not.toContain('فيسبوك')
    expect(n.text).not.toContain('لينكدإن')
    expect(n.text).toContain('application-files/7')
  })
})
