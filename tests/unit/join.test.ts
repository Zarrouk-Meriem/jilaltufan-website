import { describe, expect, it } from 'vitest'
import { canShowJoinLink } from '@/lib/time/join'

const s = { startsAt: '2026-10-15T13:00:00.000Z', durationMinutes: 90 }
const at = (iso: string, policy: 'always' | 'window' | 'email-only' = 'window') =>
  canShowJoinLink(s, { policy, windowMinutes: 30, now: new Date(iso) })

describe('canShowJoinLink — window policy', () => {
  it('hidden well before', () => expect(at('2026-10-15T12:00:00Z')).toBe(false))
  it('hidden one second before the window', () => expect(at('2026-10-15T12:29:59Z')).toBe(false))
  it('shown at window start', () => expect(at('2026-10-15T12:30:00Z')).toBe(true))
  it('shown while live', () => expect(at('2026-10-15T13:45:00Z')).toBe(true))
  it('hidden at the end', () => expect(at('2026-10-15T14:30:00Z')).toBe(false))
})
describe('canShowJoinLink — other policies', () => {
  it('always: shown before, hidden after end', () => {
    expect(at('2026-10-01T00:00:00Z', 'always')).toBe(true)
    expect(at('2026-10-15T15:00:00Z', 'always')).toBe(false)
  })
  it('email-only: never', () => expect(at('2026-10-15T13:00:00Z', 'email-only')).toBe(false))
  it('cancelled sessions never show, even inside the window', () => {
    expect(
      canShowJoinLink(
        { ...s, sessionStatus: 'cancelled' },
        { policy: 'always', windowMinutes: 30, now: new Date('2026-10-15T13:00:00Z') },
      ),
    ).toBe(false)
  })
})
