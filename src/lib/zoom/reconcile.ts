/**
 * Turning a Zoom participant report into attendance rows (PLAN.md §13.5).
 *
 * This is the whole of the matching, and it is deliberately a pure function: the academy's
 * register should not depend on anything that can only be tested by holding a real meeting.
 * `sync.ts` fetches and writes; everything that decides *what* to write is here.
 */

/** One line of Zoom's `/report/meetings/{id}/participants`, as far as we rely on it. */
export type ZoomParticipant = {
  /** Absent for a phone join, and for a guest who never signed in to Zoom. */
  user_email?: string | null
  name?: string | null
  /** Seconds in the meeting, for this stretch of attendance. */
  duration?: number | null
  /** ISO times of this stretch; Zoom's report carries both. */
  join_time?: string | null
  leave_time?: string | null
}

/**
 * How long the meeting actually ran: first join to last leave, in minutes; 0 when the report
 * carries no times. A lecture's slot is 90 to 120 minutes (the academy's lecturer file,
 * 2026-09-26) and the session stores the longer end, so «half the session» is measured against
 * what was actually held — a student who stayed for all of a 90-minute lecture is present.
 */
export function heldMinutes(participants: ZoomParticipant[]): number {
  let first = Infinity
  let last = -Infinity
  for (const p of participants) {
    const join = p.join_time ? Date.parse(p.join_time) : NaN
    const leave = p.leave_time ? Date.parse(p.leave_time) : NaN
    if (Number.isFinite(join)) first = Math.min(first, join)
    if (Number.isFinite(leave)) last = Math.max(last, leave)
  }
  return last > first ? Math.round((last - first) / 60_000) : 0
}

export type RosterEntry = { accountId: number; email: string }

export type ExistingRow = {
  id: number
  accountId: number
  source: 'staff' | 'zoom'
}

export type AttendanceState = 'present' | 'absent' | 'excused'

export type Reconciled = {
  /** Rows to create, for students with no row yet. */
  create: { accountId: number; state: AttendanceState; minutes: number }[]
  /** Rows to update, only ever ones Zoom owns. */
  update: { id: number; state: AttendanceState; minutes: number }[]
  /** Rows a person marked: left exactly as they are, and reported so the sync can say so. */
  keptStaffMarks: number
  /**
   * Participants no account matched — a different address, a phone join, a guest. Staff see
   * these so they can mark those people themselves rather than assume Zoom was complete.
   */
  unmatched: { name: string; email: string | null; minutes: number }[]
}

/**
 * How much of a session someone has to attend to be counted present.
 *
 * Half of it, and never less than ten minutes, so a short session cannot be passed by
 * joining for a moment and a long one is not failed by dropping out near the end. It is a
 * constant rather than a setting because the academy has not been asked yet — the question
 * is in TODO.md, and this is the number the code will defend until they answer.
 */
export const PRESENT_MIN_SHARE = 0.5
export const PRESENT_MIN_MINUTES = 10

export function minutesNeeded(sessionMinutes: number): number {
  return Math.max(PRESENT_MIN_MINUTES, Math.round(sessionMinutes * PRESENT_MIN_SHARE))
}

const normalise = (email: string | null | undefined) => (email ?? '').trim().toLowerCase()

/**
 * Sum each person's time. Zoom reports a separate line every time someone rejoins — a
 * dropped connection is the common case — and counting only the longest stretch would mark
 * a student absent for having bad internet.
 */
export function minutesByEmail(participants: ZoomParticipant[]): Map<string, number> {
  const seconds = new Map<string, number>()
  for (const p of participants) {
    const email = normalise(p.user_email)
    if (!email) continue
    seconds.set(email, (seconds.get(email) ?? 0) + Math.max(0, p.duration ?? 0))
  }
  return new Map([...seconds].map(([email, s]) => [email, Math.round(s / 60)]))
}

/**
 * What the sync should write.
 *
 * Three rules, in order:
 *   1. A row a person marked is never touched. That is what `source` is for.
 *   2. Everyone on the roster gets a row — present if they were there long enough, absent
 *      if they were not. A silent absence is a fact about the session too.
 *   3. A participant nobody matched is reported, never guessed at.
 */
export function reconcile(args: {
  participants: ZoomParticipant[]
  roster: RosterEntry[]
  existing: ExistingRow[]
  sessionMinutes: number
}): Reconciled {
  const { participants, roster, existing, sessionMinutes } = args
  const held = heldMinutes(participants)
  const threshold = minutesNeeded(held > 0 ? Math.min(sessionMinutes, held) : sessionMinutes)
  const minutes = minutesByEmail(participants)
  const byAccount = new Map(existing.map((r) => [r.accountId, r]))

  const out: Reconciled = { create: [], update: [], keptStaffMarks: 0, unmatched: [] }
  const matched = new Set<string>()

  for (const entry of roster) {
    const email = normalise(entry.email)
    const attended = minutes.get(email) ?? 0
    if (minutes.has(email)) matched.add(email)

    const row = byAccount.get(entry.accountId)
    if (row?.source === 'staff') {
      out.keptStaffMarks += 1
      continue
    }
    const state: AttendanceState = attended >= threshold ? 'present' : 'absent'
    if (row) out.update.push({ id: row.id, state, minutes: attended })
    else out.create.push({ accountId: entry.accountId, state, minutes: attended })
  }

  // One line per unmatched person, with their time summed the same way.
  const seenNames = new Map<string, { name: string; email: string | null; minutes: number }>()
  for (const p of participants) {
    const email = normalise(p.user_email)
    if (email && matched.has(email)) continue
    const key = email || `name:${(p.name ?? '').trim().toLowerCase()}`
    if (!key || key === 'name:') continue
    const existingLine = seenNames.get(key)
    const mins = Math.round(Math.max(0, p.duration ?? 0) / 60)
    if (existingLine) existingLine.minutes += mins
    else seenNames.set(key, { name: (p.name ?? '').trim(), email: email || null, minutes: mins })
  }
  out.unmatched = [...seenNames.values()]

  return out
}
