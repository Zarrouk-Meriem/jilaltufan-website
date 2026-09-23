import { describe, expect, it } from 'vitest'
import { applicantEmail, statusLinkEmail } from '@/lib/email/templates'
import {
  mintStatusToken,
  statusTokenExpired,
  statusUrl,
  STATUS_TOKEN_DAYS,
} from '@/lib/applications/status-token'

describe('mintStatusToken', () => {
  it('is opaque, URL-safe, and long enough that guessing is hopeless', () => {
    const { statusToken } = mintStatusToken()
    expect(statusToken).toMatch(/^[A-Za-z0-9_-]{32}$/)
    expect(encodeURIComponent(statusToken)).toBe(statusToken)
  })
  it('never repeats', () => {
    const tokens = new Set(Array.from({ length: 200 }, () => mintStatusToken().statusToken))
    expect(tokens.size).toBe(200)
  })
  it('expires STATUS_TOKEN_DAYS after it was minted', () => {
    const now = new Date('2026-09-23T10:00:00.000Z')
    const { statusTokenExpiresAt } = mintStatusToken(now)
    expect(statusTokenExpiresAt).toBe('2026-12-22T10:00:00.000Z')
    expect(Date.parse(statusTokenExpiresAt) - now.getTime()).toBe(
      STATUS_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    )
  })
})

describe('statusTokenExpired', () => {
  const now = new Date('2026-09-23T10:00:00.000Z')
  it('is false while the link is still good', () => {
    expect(statusTokenExpired('2026-09-23T10:00:01.000Z', now)).toBe(false)
  })
  it('is true at the expiry itself, and after it', () => {
    expect(statusTokenExpired('2026-09-23T10:00:00.000Z', now)).toBe(true)
    expect(statusTokenExpired('2026-09-22T10:00:00.000Z', now)).toBe(true)
  })
  it('treats a row with no expiry — one written before this feature — as expired', () => {
    expect(statusTokenExpired(null, now)).toBe(true)
    expect(statusTokenExpired(undefined, now)).toBe(true)
  })
  it('treats an unreadable date as expired rather than as valid forever', () => {
    expect(statusTokenExpired('not a date', now)).toBe(true)
  })
  it('a freshly minted token is not expired', () => {
    const { statusTokenExpiresAt } = mintStatusToken(now)
    expect(statusTokenExpired(statusTokenExpiresAt, now)).toBe(false)
  })
})

describe('statusUrl', () => {
  it('points at the applicant’s own language', () => {
    expect(statusUrl('abc123', 'ar')).toMatch(/\/ar\/application\/abc123$/)
    expect(statusUrl('abc123', 'en')).toMatch(/\/en\/application\/abc123$/)
  })
})

describe('the letters that carry the link', () => {
  const url = 'https://jilaltufan.org/ar/application/abc123'

  it('puts the link in the confirmation, as a button and as bare text', () => {
    const mail = applicantEmail('ar', 'مريم', url)
    expect(mail.html).toContain(`href="${url}"`)
    expect(mail.text).toContain(url)
    expect(mail.text).toContain('تابع حالة طلبك')
  })

  it('says nothing about following the application when there is no link to give', () => {
    const mail = applicantEmail('ar', 'مريم')
    expect(mail.html).not.toContain('<a href')
    expect(mail.text).not.toContain('متابعة حالة طلبك')
  })

  it('tells someone who did not ask for a new link that it only ever reaches them', () => {
    expect(statusLinkEmail('en', 'Maryam', url).text).toContain('only ever sent to this address')
    expect(statusLinkEmail('ar', 'مريم', url).text).toContain('ولا يصل أي رابط إلا إلى بريدك')
  })

  it('escapes the link rather than trusting it into the markup', () => {
    const mail = applicantEmail('en', 'Maryam', 'https://x.test/a"><script>alert(1)</script>')
    expect(mail.html).not.toContain('<script>')
    expect(mail.html).toContain('&quot;&gt;&lt;script&gt;')
  })
})
