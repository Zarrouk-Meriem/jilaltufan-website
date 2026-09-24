import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import report from '../fixtures/zoom-participants.json'
import { forgetZoomToken } from '@/lib/zoom/client'
import { syncSessionAttendance } from '@/lib/zoom/sync'

/**
 * A Payload stand-in holding just what the sync reads, and recording what it writes. The
 * point is the write path: that a sync's rows are Zoom's, and that it never reaches for a
 * row a person owns.
 */
function fakePayload(existing: { id: number; account: number; source: 'staff' | 'zoom' }[] = []) {
  const created: Record<string, unknown>[] = []
  const updated: { id: number; data: Record<string, unknown> }[] = []
  const payload = {
    findByID: async ({ collection }: { collection: string }) => {
      if (collection !== 'sessions') throw new Error(`unexpected findByID: ${collection}`)
      return { id: 7, zoomMeetingId: '88899', program: 3, durationMinutes: 60 }
    },
    find: async ({ collection }: { collection: string }) => {
      if (collection === 'applications')
        return { docs: [{ id: 11 }, { id: 12 }, { id: 13 }, { id: 14 }] }
      if (collection === 'accounts')
        return {
          docs: [
            { id: 1, email: 'maryam@example.org' },
            { id: 2, email: 'ahmad@example.org' },
            { id: 3, email: 'sara@example.org' },
            { id: 4, email: 'khaled@example.org' },
          ],
        }
      if (collection === 'attendance')
        return { docs: existing.map((r) => ({ id: r.id, account: r.account, source: r.source })) }
      throw new Error(`unexpected find: ${collection}`)
    },
    create: async ({ data }: { data: Record<string, unknown> }) => {
      created.push(data)
      return { id: 100 + created.length }
    },
    update: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      updated.push({ id, data })
      return { id }
    },
    logger: { error: () => {} },
  } as unknown as Payload
  return { payload, created, updated }
}

/** A Zoom that answers with the fixture. */
const zoomReturning = (participants: unknown[]) =>
  (async (input: RequestInfo | URL) =>
    String(input).startsWith('https://zoom.us/oauth/token')
      ? new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }), { status: 200 })
      : new Response(JSON.stringify({ participants }), { status: 200 })) as unknown as typeof fetch

const CREDENTIALS = { ZOOM_ACCOUNT_ID: 'a', ZOOM_CLIENT_ID: 'b', ZOOM_CLIENT_SECRET: 'c' }

describe('syncSessionAttendance', () => {
  beforeEach(() => {
    forgetZoomToken()
    Object.assign(process.env, CREDENTIALS)
  })
  afterEach(() => {
    for (const k of Object.keys(CREDENTIALS)) delete process.env[k as keyof typeof CREDENTIALS]
    forgetZoomToken()
  })

  it('writes a row for every student, and every row is Zoom’s', async () => {
    const { payload, created, updated } = fakePayload()
    const result = await syncSessionAttendance(payload, 7, zoomReturning(report.participants))

    expect(result).toMatchObject({ created: 4, updated: 0, keptStaffMarks: 0, rosterSize: 4 })
    expect(created.every((row) => row.source === 'zoom')).toBe(true)
    expect(created.map((row) => [row.account, row.state, row.minutes])).toEqual([
      [1, 'present', 41],
      [2, 'present', 35],
      [3, 'absent', 4],
      [4, 'absent', 0],
    ])
    expect(updated).toEqual([])
  })

  it('leaves a row a person marked exactly where it is', async () => {
    const { payload, created, updated } = fakePayload([{ id: 50, account: 1, source: 'staff' }])
    const result = await syncSessionAttendance(payload, 7, zoomReturning(report.participants))

    expect(result.keptStaffMarks).toBe(1)
    expect(updated.map((u) => u.id)).not.toContain(50)
    expect(created.map((c) => c.account)).toEqual([2, 3, 4])
  })

  it('corrects a row it wrote before, so a second run is safe', async () => {
    const { payload, updated } = fakePayload([{ id: 60, account: 3, source: 'zoom' }])
    await syncSessionAttendance(payload, 7, zoomReturning(report.participants))
    expect(updated).toEqual([{ id: 60, data: { state: 'absent', source: 'zoom', minutes: 4 } }])
  })

  it('hands back the people it could not match, rather than dropping them', async () => {
    const { payload } = fakePayload()
    const result = await syncSessionAttendance(payload, 7, zoomReturning(report.participants))
    expect(result.unmatched.map((u) => u.name)).toEqual(['ضيف الحصة', '16041234567', 'خالد'])
  })

  it('refuses a session with no meeting id instead of syncing nothing quietly', async () => {
    const { payload } = fakePayload()
    const noMeeting = {
      ...payload,
      findByID: async () => ({ id: 7, zoomMeetingId: null, program: 3, durationMinutes: 60 }),
    } as unknown as Payload
    await expect(syncSessionAttendance(noMeeting, 7, zoomReturning([]))).rejects.toMatchObject({
      reason: 'not-found',
    })
  })
})
