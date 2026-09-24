/**
 * Which certificates a student has earned and not yet received (user decisions,
 * 2026-09-24). Pure, so the rule is tested on its own:
 *
 *   - graduation — a directed program whose enrollment staff marked «تخرّج»;
 *   - attendance — Open Training, once the student attended at least the share set in
 *     Site settings of the program's (non-cancelled) lectures. No share set: none.
 *
 * Nothing is due twice: a certificate of that kind for that program already issued
 * (revoked or not) stops it — a revoked one is not silently re-issued.
 */

export type Kind = 'graduation' | 'attendance'

export type EnrollmentForCertificate = {
  programId: number
  track: 'open' | 'directed' | 'projects'
  graduated: boolean
}

export function dueCertificates({
  enrollments,
  attendance,
  attendanceShare,
  issued,
}: {
  /** The student's current (`enrolled`) enrollments. */
  enrollments: EnrollmentForCertificate[]
  /** Per program: sessions attended and held. */
  attendance: Map<number, { attended: number; total: number }>
  /** Percent from Site settings; empty issues no attendance certificates. */
  attendanceShare: number | null | undefined
  issued: { programId: number; kind: Kind }[]
}): { programId: number; kind: Kind }[] {
  const has = (programId: number, kind: Kind) =>
    issued.some((c) => c.programId === programId && c.kind === kind)
  const due: { programId: number; kind: Kind }[] = []
  for (const e of enrollments) {
    if (e.track === 'directed' && e.graduated && !has(e.programId, 'graduation'))
      due.push({ programId: e.programId, kind: 'graduation' })
    if (e.track === 'open' && attendanceShare && !has(e.programId, 'attendance')) {
      const a = attendance.get(e.programId)
      if (a && a.total > 0 && (a.attended / a.total) * 100 >= attendanceShare)
        due.push({ programId: e.programId, kind: 'attendance' })
    }
  }
  return due
}
