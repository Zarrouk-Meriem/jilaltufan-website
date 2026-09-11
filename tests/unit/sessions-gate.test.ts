import { describe, expect, it } from 'vitest'
import { toPublic } from '@/lib/queries/sessions'
import type { Session } from '@/payload-types'

const s = {
  id: 1,
  program: 1,
  number: 1,
  title: 't',
  startsAt: '2026-10-15T13:00:00.000Z',
  durationMinutes: 90,
  sessionStatus: 'scheduled',
  zoomJoinUrl: 'https://us02web.zoom.us/j/123',
  zoomMeetingId: '123',
  zoomPasscode: 'secret',
  status: 'published',
  updatedAt: '',
  createdAt: '',
} as unknown as Session

describe('toPublic strips Zoom fields', () => {
  it('never includes passcode or meeting id, and omits the URL outside the window', () => {
    const p = toPublic(s, {
      policy: 'window',
      windowMinutes: 30,
      now: new Date('2026-10-15T10:00:00Z'),
    })
    expect(JSON.stringify(p)).not.toMatch(/secret|zoomPasscode|zoomMeetingId|zoomJoinUrl|zoom\.us/)
    expect(p.joinUrl).toBeNull()
  })
  it('exposes the URL only as joinUrl inside the window', () => {
    const p = toPublic(s, {
      policy: 'window',
      windowMinutes: 30,
      now: new Date('2026-10-15T12:45:00Z'),
    })
    expect(p.joinUrl).toBe('https://us02web.zoom.us/j/123')
    expect(JSON.stringify(p)).not.toMatch(/secret|zoomPasscode/)
  })
})
