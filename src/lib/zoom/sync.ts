import type { Payload } from 'payload'
import { meetingParticipants, zoomConfigured, ZoomError } from './client'
import { reconcile, type ExistingRow, type RosterEntry, type ZoomParticipant } from './reconcile'

export type SyncResult = {
  created: number
  updated: number
  keptStaffMarks: number
  unmatched: { name: string; email: string | null; minutes: number }[]
  rosterSize: number
}

/**
 * Pull one session's attendance from Zoom (PLAN.md §13.5).
 *
 * The writes go through the Local API with `overrideAccess` and no user, which is exactly
 * what keeps `source: 'zoom'` on them: the collection's hook stamps a row as a staff mark
 * only when a signed-in staff account is making the request. So a sync can never
 * impersonate a person, and `reconcile` never hands it a row a person owns.
 *
 * `fetchImpl` is here so the whole path can be exercised against a fixture — the academy's
 * register should not need a real meeting to be testable.
 */
export async function syncSessionAttendance(
  payload: Payload,
  sessionId: number,
  fetchImpl: typeof fetch = fetch,
): Promise<SyncResult> {
  // Before anything about this session: connecting Zoom is the precondition for the whole
  // feature, and staff should hear that rather than a detail about one session's meeting id.
  if (!zoomConfigured()) throw new ZoomError('Zoom is not connected', 'unconfigured')

  const session = await payload.findByID({
    collection: 'sessions',
    id: sessionId,
    depth: 0,
    overrideAccess: true,
  })
  const meetingId = session.zoomMeetingId
  if (!meetingId) throw new ZoomError('This session has no Zoom meeting id', 'not-found')

  const programId =
    typeof session.program === 'number' ? session.program : (session.program as { id: number })?.id
  if (!programId)
    throw new ZoomError('This session has no program, so it has no roster', 'not-found')

  const participants: ZoomParticipant[] = await meetingParticipants(String(meetingId), fetchImpl)

  // The roster: accounts opened from an application accepted onto this program.
  const applications = await payload.find({
    collection: 'applications',
    where: {
      and: [{ program: { equals: programId } }, { applicationStatus: { equals: 'accepted' } }],
    },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
    select: { applicationStatus: true },
  })
  const applicationIds = applications.docs.map((d) => d.id)
  const accounts = applicationIds.length
    ? await payload.find({
        collection: 'accounts',
        where: { application: { in: applicationIds } },
        limit: 1000,
        depth: 0,
        overrideAccess: true,
      })
    : { docs: [] }

  const roster: RosterEntry[] = accounts.docs.map((a) => ({ accountId: a.id, email: a.email }))

  const rows = await payload.find({
    collection: 'attendance',
    where: { session: { equals: sessionId } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })
  const existing: ExistingRow[] = rows.docs.map((r) => ({
    id: r.id,
    accountId: typeof r.account === 'number' ? r.account : (r.account as { id: number }).id,
    source: r.source === 'zoom' ? 'zoom' : 'staff',
  }))

  const plan = reconcile({
    participants,
    roster,
    existing,
    sessionMinutes: session.durationMinutes ?? 60,
  })

  for (const row of plan.create)
    await payload.create({
      collection: 'attendance',
      data: {
        session: sessionId,
        account: row.accountId,
        state: row.state,
        source: 'zoom',
        minutes: row.minutes,
      },
      overrideAccess: true,
    })

  for (const row of plan.update)
    await payload.update({
      collection: 'attendance',
      id: row.id,
      data: { state: row.state, source: 'zoom', minutes: row.minutes },
      overrideAccess: true,
    })

  return {
    created: plan.create.length,
    updated: plan.update.length,
    keptStaffMarks: plan.keptStaffMarks,
    unmatched: plan.unmatched,
    rosterSize: roster.length,
  }
}
