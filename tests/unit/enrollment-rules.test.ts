import { describe, expect, it } from 'vitest'
import {
  checkEnrollment,
  programState,
  type EnrollmentFacts,
  type ProgramFacts,
} from '@/lib/enrollment/rules'

const open: ProgramFacts = { id: 1, track: 'open', registrationMode: 'open', published: true }
const compass: ProgramFacts = {
  id: 2,
  track: 'directed',
  registrationMode: 'application',
  published: true,
}
const leaders: ProgramFacts = { ...compass, id: 3 }
const projects: ProgramFacts = {
  id: 6,
  track: 'projects',
  registrationMode: 'closed',
  published: true,
}

const row = (p: ProgramFacts, active = true, id?: number): EnrollmentFacts => ({
  id,
  programId: p.id,
  track: p.track,
  active,
})

describe('checkEnrollment', () => {
  it('lets an accepted student take open training and one directed program', () => {
    expect(checkEnrollment({ program: open, existing: [], by: 'student' })).toEqual({ ok: true })
    expect(checkEnrollment({ program: compass, existing: [row(open)], by: 'student' })).toEqual({
      ok: true,
    })
  })

  it('refuses a second directed program, for staff too', () => {
    for (const by of ['student', 'staff'] as const)
      expect(checkEnrollment({ program: leaders, existing: [row(compass)], by })).toEqual({
        ok: false,
        reason: 'other-directed',
      })
  })

  it('does not count a removed enrollment', () => {
    expect(
      checkEnrollment({ program: leaders, existing: [row(compass, false)], by: 'student' }),
    ).toEqual({ ok: true })
  })

  it('lets staff move a student: the row being changed is not counted against itself', () => {
    expect(
      checkEnrollment({
        program: leaders,
        existing: [row(compass, true, 10)],
        by: 'staff',
        enrollmentId: 10,
      }),
    ).toEqual({ ok: true })
  })

  it('refuses the same program twice', () => {
    expect(checkEnrollment({ program: open, existing: [row(open)], by: 'student' })).toEqual({
      ok: false,
      reason: 'already-enrolled',
    })
  })

  it('never enrolls anyone in strategic projects', () => {
    for (const by of ['student', 'staff'] as const)
      expect(checkEnrollment({ program: projects, existing: [], by })).toEqual({
        ok: false,
        reason: 'not-enrollable',
      })
  })

  it('a closed or unpublished program refuses students but not staff', () => {
    const closed = { ...compass, registrationMode: 'closed' as const }
    const draft = { ...compass, published: false }
    for (const p of [closed, draft]) {
      expect(checkEnrollment({ program: p, existing: [], by: 'student' })).toEqual({
        ok: false,
        reason: 'closed',
      })
      expect(checkEnrollment({ program: p, existing: [], by: 'staff' })).toEqual({ ok: true })
    }
  })
})

describe('programState', () => {
  it('shows each program as enrolled, available, or blocked by the other directed choice', () => {
    const existing = [row(open), row(compass)]
    expect(programState(open, existing)).toBe('enrolled')
    expect(programState(compass, existing)).toBe('enrolled')
    expect(programState(leaders, existing)).toBe('other-directed')
    expect(programState(leaders, [row(open)])).toBe('available')
    expect(programState(projects, [])).toBe('closed')
  })
})
