import { describe, expect, it } from 'vitest'
import { buildIcs, googleCalendarUrl, icsDate } from '@/lib/calendar'

const e = {
  uid: 'session-12@jilaltufan.com',
  title: 'فلسطين بوصلتنا — الحصة الأولى',
  description: 'Live on Zoom; link sent to registrants, before the session.',
  start: new Date('2026-10-15T13:00:00Z'),
  end: new Date('2026-10-15T14:30:00Z'),
}

describe('calendar', () => {
  it('formats UTC timestamps', () => expect(icsDate(e.start)).toBe('20261015T130000Z'))
  it('builds a valid VEVENT with CRLF line endings', () => {
    const ics = buildIcs(e)
    expect(ics).toMatch(/^BEGIN:VCALENDAR\r\n/)
    expect(ics).toContain('DTSTART:20261015T130000Z\r\n')
    expect(ics).toContain('DTEND:20261015T143000Z\r\n')
    expect(ics).toContain('SUMMARY:فلسطين بوصلتنا — الحصة الأولى')
    expect(ics).toMatch(/END:VCALENDAR\r\n$/)
  })
  it('escapes ; and , in text values (RFC 5545 §3.3.11)', () => {
    const ics = buildIcs(e)
    const desc = ics.split('\r\n').find((l) => l.startsWith('DESCRIPTION:'))!
    expect(desc).toBe('DESCRIPTION:Live on Zoom\\; link sent to registrants\\, before the session.')
  })
  it('folds long lines without splitting UTF-8 sequences', () => {
    const ics = buildIcs({ ...e, description: 'ع'.repeat(200) })
    for (const line of ics.split('\r\n'))
      expect(Buffer.byteLength(line, 'utf8')).toBeLessThanOrEqual(75)
    expect(ics.replace(/\r\n /g, '')).toContain('ع'.repeat(200))
  })
  it('builds a Google Calendar template URL', () => {
    const u = new URL(googleCalendarUrl(e))
    expect(u.hostname).toBe('calendar.google.com')
    expect(u.searchParams.get('dates')).toBe('20261015T130000Z/20261015T143000Z')
    expect(u.searchParams.get('text')).toBe(e.title)
  })
})
