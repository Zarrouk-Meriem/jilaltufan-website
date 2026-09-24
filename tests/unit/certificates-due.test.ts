import { describe, expect, it } from 'vitest'
import { dueCertificates } from '@/lib/certificates/due'

const open = { programId: 1, track: 'open' as const, graduated: false }
const compass = { programId: 2, track: 'directed' as const, graduated: false }

describe('dueCertificates', () => {
  it('issues a graduation certificate only once staff mark the student graduated', () => {
    const base = { attendance: new Map(), attendanceShare: 75, issued: [] }
    expect(dueCertificates({ ...base, enrollments: [compass] })).toEqual([])
    expect(dueCertificates({ ...base, enrollments: [{ ...compass, graduated: true }] })).toEqual([
      { programId: 2, kind: 'graduation' },
    ])
  })

  it('issues an Open Training attendance certificate at the share, not below it', () => {
    const run = (attended: number) =>
      dueCertificates({
        enrollments: [open],
        attendance: new Map([[1, { attended, total: 8 }]]),
        attendanceShare: 75,
        issued: [],
      })
    expect(run(5)).toEqual([]) // 62.5 %
    expect(run(6)).toEqual([{ programId: 1, kind: 'attendance' }]) // 75 %
  })

  it('issues no attendance certificate while the academy has not set a share', () => {
    expect(
      dueCertificates({
        enrollments: [open],
        attendance: new Map([[1, { attended: 8, total: 8 }]]),
        attendanceShare: null,
        issued: [],
      }),
    ).toEqual([])
  })

  it('never issues the same certificate twice, even after it was revoked', () => {
    expect(
      dueCertificates({
        enrollments: [{ ...compass, graduated: true }],
        attendance: new Map(),
        attendanceShare: 75,
        issued: [{ programId: 2, kind: 'graduation' }],
      }),
    ).toEqual([])
  })

  it('a graduated mark on Open Training issues nothing, and a directed program earns no attendance certificate', () => {
    expect(
      dueCertificates({
        enrollments: [{ ...open, graduated: true }, compass],
        attendance: new Map([[2, { attended: 6, total: 6 }]]),
        attendanceShare: 50,
        issued: [],
      }),
    ).toEqual([])
  })
})
