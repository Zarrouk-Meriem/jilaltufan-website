import type { Account, Certificate } from '@/payload-types'
import { enrolledPrograms } from '@/lib/enrollment/access'
import { getAccountProgress } from '@/lib/queries/account'
import { getClient } from '@/lib/queries/client'
import { getSiteSettings } from '@/lib/queries/globals'
import { newCertificateNumber } from '@/collections/Certificates'
import { dueCertificates, type Kind } from './due'

const idOf = (v: unknown): number | null =>
  typeof v === 'number'
    ? v
    : typeof v === 'object' && v && 'id' in v
      ? Number((v as { id: unknown }).id)
      : null

/**
 * Issues whatever the student has earned and not yet received, then returns all their
 * certificates. Run when they open their certificates, so a staff tick on «تخرّج» or the
 * lecture that crossed the attendance share shows up on their next visit — no scheduler.
 *
 * A due certificate waits for the student's official names (Arabic and English): it is
 * printed with them and keeps them, so it is never issued with a guess. `waitingForName`
 * tells the window to ask.
 */
export async function issueDueCertificates(
  account: Account,
): Promise<{ certificates: Certificate[]; waitingForName: boolean }> {
  const payload = await getClient()
  const mine = async () =>
    (
      await payload.find({
        collection: 'certificates',
        where: { account: { equals: account.id } },
        sort: '-issuedAt',
        depth: 0,
        limit: 50,
        overrideAccess: true,
      })
    ).docs

  if (account.kind !== 'student') return { certificates: [], waitingForName: false }
  const programs = await enrolledPrograms(account, 'ar')
  if (!programs.length) return { certificates: await mine(), waitingForName: false }

  const [rows, settings, issued] = await Promise.all([
    payload.find({
      collection: 'enrollments',
      where: { and: [{ account: { equals: account.id } }, { state: { equals: 'enrolled' } }] },
      depth: 0,
      limit: 20,
      overrideAccess: true,
    }),
    getSiteSettings('ar'),
    mine(),
  ])
  const graduated = new Map(rows.docs.map((r) => [idOf(r.program), !!r.graduated]))
  const attendance = new Map<number, { attended: number; total: number }>()
  for (const p of programs.filter((p) => p.track === 'open')) {
    const progress = await getAccountProgress(account, p)
    if (progress) attendance.set(p.id, { attended: progress.attended, total: progress.total })
  }

  const due = dueCertificates({
    enrollments: programs.map((p) => ({
      programId: p.id,
      track: p.track,
      graduated: graduated.get(p.id) ?? false,
    })),
    attendance,
    attendanceShare: settings.attendanceCertificateShare,
    issued: issued.map((c) => ({ programId: idOf(c.program) ?? 0, kind: c.kind as Kind })),
  })
  if (!due.length) return { certificates: issued, waitingForName: false }

  const nameAr = account.officialNameAr?.trim()
  const nameEn = account.officialNameEn?.trim()
  if (!nameAr || !nameEn) return { certificates: issued, waitingForName: true }

  for (const d of due) {
    const [ar, en] = await Promise.all(
      (['ar', 'en'] as const).map((locale) =>
        payload.findByID({
          collection: 'programs',
          id: d.programId,
          locale,
          fallbackLocale: 'ar',
          depth: 0,
          overrideAccess: true,
        }),
      ),
    )
    try {
      await payload.create({
        collection: 'certificates',
        data: {
          number: newCertificateNumber(),
          issuedAt: new Date().toISOString(),
          kind: d.kind,
          account: account.id,
          program: d.programId,
          nameAr,
          nameEn,
          programTitleAr: ar!.title,
          programTitleEn: en!.title,
        },
        overrideAccess: true,
      })
    } catch (err) {
      // Two tabs at once: the unique index lets one through; the other is not an error.
      payload.logger.warn({ err, msg: 'certificate not created', account: account.id, ...d })
    }
  }
  return { certificates: await mine(), waitingForName: false }
}

/** A certificate by its number, for the public verification page. Staff-only fields out. */
export async function certificateByNumber(number: string) {
  if (!/^JAA-\d{4}-[2-9A-HJ-KM-NP-Z]{6}$/.test(number)) return null
  const payload = await getClient()
  const res = await payload.find({
    collection: 'certificates',
    where: { number: { equals: number } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  const c = res.docs[0]
  if (!c) return null
  return {
    number: c.number,
    kind: c.kind as Kind,
    nameAr: c.nameAr,
    nameEn: c.nameEn,
    programTitleAr: c.programTitleAr,
    programTitleEn: c.programTitleEn,
    issuedAt: c.issuedAt,
    revoked: !!c.revoked,
  }
}
