/**
 * Who may enroll in what (user decision, 2026-09-24). An accepted student enrolls
 * themselves, free:
 *
 *   - التدريب المفتوح (track `open`) — open to every accepted student;
 *   - **one** of the four programs of التدريب الموجّه (track `directed`) at a time;
 *   - strategic projects (track `projects`) are not a program anyone enrolls in.
 *
 * A student's directed choice is final for them; staff can move or remove it from the
 * admin (then `by: 'staff'`, which also lets staff enroll someone in a program whose
 * enrollment is closed). The one-directed rule holds for staff too — "at the same time"
 * is about the student, not about who clicked.
 *
 * Pure on purpose: the collection hook, the student's action, and the window's program
 * list all ask the same question, and a unit test can ask it without a database.
 */

export type Track = 'open' | 'directed' | 'projects'

export type ProgramFacts = {
  id: number
  track: Track
  /** The program's own switch: `closed` stops new enrollments. */
  registrationMode: 'open' | 'application' | 'closed' | null | undefined
  published: boolean
}

export type EnrollmentFacts = {
  /** The enrollment row's id, when it already exists. */
  id?: number
  programId: number
  track: Track
  active: boolean
}

export type Refusal = 'not-enrollable' | 'closed' | 'already-enrolled' | 'other-directed'

export function checkEnrollment({
  program,
  existing,
  by,
  enrollmentId,
}: {
  program: ProgramFacts
  /** Every enrollment the account has, active or not. */
  existing: EnrollmentFacts[]
  by: 'student' | 'staff'
  /** When updating a row, that row — so it is not counted against itself. */
  enrollmentId?: number
}): { ok: true } | { ok: false; reason: Refusal } {
  if (program.track === 'projects') return { ok: false, reason: 'not-enrollable' }
  if (by === 'student' && (!program.published || program.registrationMode === 'closed'))
    return { ok: false, reason: 'closed' }

  const others = existing.filter(
    (e) => e.active && (enrollmentId === undefined || e.id !== enrollmentId),
  )
  if (others.some((e) => e.programId === program.id))
    return { ok: false, reason: 'already-enrolled' }
  if (program.track === 'directed' && others.some((e) => e.track === 'directed'))
    return { ok: false, reason: 'other-directed' }
  return { ok: true }
}

/** What the student's program list shows for each program. */
export type ProgramState = 'enrolled' | 'available' | 'other-directed' | 'closed'

export function programState(program: ProgramFacts, existing: EnrollmentFacts[]): ProgramState {
  if (existing.some((e) => e.active && e.programId === program.id)) return 'enrolled'
  const check = checkEnrollment({ program, existing, by: 'student' })
  if (check.ok) return 'available'
  return check.reason === 'other-directed' ? 'other-directed' : 'closed'
}
