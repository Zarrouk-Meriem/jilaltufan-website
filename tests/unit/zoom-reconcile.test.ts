import { describe, expect, it } from 'vitest'
import report from '../fixtures/zoom-participants.json'
import {
  minutesByEmail,
  minutesNeeded,
  reconcile,
  PRESENT_MIN_MINUTES,
  type ExistingRow,
  type RosterEntry,
  type ZoomParticipant,
} from '@/lib/zoom/reconcile'

const participants = report.participants as ZoomParticipant[]

/** The four students the academy has on this program. خالد joined without an address. */
const roster: RosterEntry[] = [
  { accountId: 1, email: 'maryam@example.org' },
  { accountId: 2, email: 'ahmad@example.org' },
  { accountId: 3, email: 'sara@example.org' },
  { accountId: 4, email: 'khaled@example.org' },
]

const SESSION_MINUTES = 60

describe('minutesNeeded', () => {
  it('is half the session', () => {
    expect(minutesNeeded(60)).toBe(30)
    expect(minutesNeeded(90)).toBe(45)
  })
  it('never falls below ten minutes, so a short session cannot be passed by looking in', () => {
    expect(minutesNeeded(10)).toBe(PRESENT_MIN_MINUTES)
    expect(minutesNeeded(0)).toBe(PRESENT_MIN_MINUTES)
  })
})

describe('minutesByEmail', () => {
  it('sums a student who dropped out and came back', () => {
    // 780s + 1320s = 35 minutes; the longest single stretch alone would be 22.
    expect(minutesByEmail(participants).get('ahmad@example.org')).toBe(35)
  })
  it('matches an address whatever its capitalisation', () => {
    expect(minutesByEmail(participants).get('sara@example.org')).toBe(4)
  })
  it('ignores a join with no address rather than inventing a key for it', () => {
    expect([...minutesByEmail(participants).keys()]).not.toContain('')
  })
})

describe('reconcile', () => {
  const run = (existing: ExistingRow[] = []) =>
    reconcile({ participants, roster, existing, sessionMinutes: SESSION_MINUTES })

  it('marks the students who were there long enough present, and the rest absent', () => {
    const out = run()
    expect(out.create).toEqual([
      { accountId: 1, state: 'present', minutes: 41 },
      { accountId: 2, state: 'present', minutes: 35 },
      // Four minutes of a sixty-minute session.
      { accountId: 3, state: 'absent', minutes: 4 },
      // Never appeared under an address we know.
      { accountId: 4, state: 'absent', minutes: 0 },
    ])
    expect(out.update).toEqual([])
  })

  it('never touches a row a person marked', () => {
    const out = run([
      { id: 90, accountId: 3, source: 'staff' },
      { id: 91, accountId: 4, source: 'staff' },
    ])
    expect(out.keptStaffMarks).toBe(2)
    expect(out.update.map((u) => u.id)).not.toContain(90)
    expect(out.update.map((u) => u.id)).not.toContain(91)
    expect(out.create.map((c) => c.accountId)).toEqual([1, 2])
  })

  it('updates a row it wrote itself, so a re-run corrects an earlier sync', () => {
    const out = run([{ id: 80, accountId: 3, source: 'zoom' }])
    expect(out.update).toEqual([{ id: 80, state: 'absent', minutes: 4 }])
    expect(out.create.map((c) => c.accountId)).toEqual([1, 2, 4])
  })

  it('reports the people it could not match instead of guessing at them', () => {
    const out = run()
    const names = out.unmatched.map((u) => u.name)
    // The guest instructor, the phone join, and the student with no address on the call.
    expect(names).toContain('ضيف الحصة')
    expect(names).toContain('16041234567')
    expect(names).toContain('خالد')
    expect(out.unmatched).toHaveLength(3)
    // A student it did match is not reported as a stranger.
    expect(names).not.toContain('مريم الزروق')
  })

  it('keeps the minutes of an unmatched person, so staff can judge them', () => {
    const phone = run().unmatched.find((u) => u.name === '16041234567')
    expect(phone).toMatchObject({ email: null, minutes: 39 })
  })

  it('writes a row for every student on the roster, present or not', () => {
    const out = run()
    expect(out.create.length + out.update.length + out.keptStaffMarks).toBe(roster.length)
  })

  it('marks everyone absent when the meeting report is empty', () => {
    const out = reconcile({
      participants: [],
      roster,
      existing: [],
      sessionMinutes: SESSION_MINUTES,
    })
    expect(out.create.every((c) => c.state === 'absent' && c.minutes === 0)).toBe(true)
    expect(out.unmatched).toEqual([])
  })

  it('counts a student exactly at the threshold as present', () => {
    const out = reconcile({
      participants: [{ user_email: 'maryam@example.org', name: 'م', duration: 30 * 60 }],
      roster: [roster[0]!],
      existing: [],
      sessionMinutes: SESSION_MINUTES,
    })
    expect(out.create[0]).toMatchObject({ state: 'present', minutes: 30 })
  })
})
