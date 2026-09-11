import { describe, expect, it } from 'vitest'
import {
  currentSeasonStartYear,
  formatInZone,
  getSessionState,
  monthKeyInZone,
  msUntilNextBoundary,
  seasonMonthKeys,
} from '@/lib/time'

// 15 Oct 2026 16:00 Asia/Hebron (UTC+3 in DST) = 13:00Z
const startsAt = '2026-10-15T13:00:00.000Z'
const s = { startsAt, durationMinutes: 90 }

describe('getSessionState', () => {
  it('upcoming well before', () =>
    expect(getSessionState(s, new Date('2026-10-15T10:00:00Z'))).toBe('upcoming'))
  it('starting-soon inside the 30-minute window', () =>
    expect(getSessionState(s, new Date('2026-10-15T12:31:00Z'))).toBe('starting-soon'))
  it('exactly at window start is starting-soon', () =>
    expect(getSessionState(s, new Date('2026-10-15T12:30:00Z'))).toBe('starting-soon'))
  it('live at start and during', () => {
    expect(getSessionState(s, new Date('2026-10-15T13:00:00Z'))).toBe('live')
    expect(getSessionState(s, new Date('2026-10-15T14:29:59Z'))).toBe('live')
  })
  it('completed at end', () =>
    expect(getSessionState(s, new Date('2026-10-15T14:30:00Z'))).toBe('completed'))
  it('editor flags win', () => {
    expect(
      getSessionState({ ...s, sessionStatus: 'cancelled' }, new Date('2026-10-15T13:00:00Z')),
    ).toBe('cancelled')
    expect(
      getSessionState({ ...s, sessionStatus: 'completed' }, new Date('2026-10-15T10:00:00Z')),
    ).toBe('completed')
  })
  it('honours a custom window', () =>
    expect(getSessionState(s, new Date('2026-10-15T12:31:00Z'), 10)).toBe('upcoming'))
})

describe('msUntilNextBoundary', () => {
  it('counts down to the window, then start, then end', () => {
    expect(msUntilNextBoundary(s, new Date('2026-10-15T12:00:00Z'))).toBe(30 * 60_000)
    expect(msUntilNextBoundary(s, new Date('2026-10-15T12:45:00Z'))).toBe(15 * 60_000)
    expect(msUntilNextBoundary(s, new Date('2026-10-15T14:00:00Z'))).toBe(30 * 60_000)
    expect(msUntilNextBoundary(s, new Date('2026-10-15T15:00:00Z'))).toBeNull()
  })
})

describe('formatInZone', () => {
  it('renders Al-Quds time with Western digits in Arabic', () => {
    const p = formatInZone(startsAt, 'ar')
    expect(p.time).toBe('16:00')
    expect(p.day).toBe('15')
    expect(p.month).toBe('أكتوبر')
    expect(p.date).toMatch(/15 أكتوبر 2026/)
  })
  it('renders English', () => {
    const p = formatInZone(startsAt, 'en')
    expect(p.time).toBe('16:00')
    expect(p.date).toBe('15 October 2026')
  })
  it('respects DST: Jan session at 16:00 local is 14:00Z', () => {
    expect(formatInZone('2027-01-15T14:00:00.000Z', 'en').time).toBe('16:00')
  })
  it('converts to a visitor zone', () => {
    expect(formatInZone(startsAt, 'en', 'Europe/Paris').time).toBe('15:00')
    expect(formatInZone(startsAt, 'en', 'America/New_York').time).toBe('09:00')
  })
})

describe('season helpers', () => {
  it('month key in zone crosses midnight correctly', () => {
    // 30 Sep 23:30Z is already 1 Oct 02:30 in Hebron
    expect(monthKeyInZone('2026-09-30T23:30:00Z')).toBe('2026-10')
  })
  it('season keys run Sep → Apr', () => {
    expect(seasonMonthKeys(2026)).toEqual([
      '2026-09',
      '2026-10',
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02',
      '2027-03',
      '2027-04',
    ])
  })
  it('current season start year', () => {
    expect(currentSeasonStartYear(new Date('2026-09-11T00:00:00Z'))).toBe(2026)
    expect(currentSeasonStartYear(new Date('2027-03-01T00:00:00Z'))).toBe(2026)
    expect(currentSeasonStartYear(new Date('2027-08-31T00:00:00Z'))).toBe(2026)
    expect(currentSeasonStartYear(new Date('2027-09-01T12:00:00Z'))).toBe(2027)
  })
})
