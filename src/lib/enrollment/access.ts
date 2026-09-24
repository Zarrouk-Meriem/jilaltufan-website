import type { Payload } from 'payload'
import { cache } from 'react'
import type { Locale } from '@/i18n/routing'
import type { Account, Program } from '@/payload-types'
import { getClient } from '@/lib/queries/client'
import type { Track } from './rules'

/**
 * The one rule for what a student may open: a program's sessions, join links and
 * materials are theirs while
 *
 *   1. their account is not deactivated,
 *   2. the application it came from is still `accepted`, and
 *   3. they have an `enrolled` row for that program.
 *
 * Withdraw any one — staff reverse an acceptance, deactivate the account, or withdraw the
 * enrollment — and the program disappears from the window on the next request. Until
 * 2026-09-24 only "a program is set on the application" was checked, so a reversed
 * acceptance kept every link.
 */

export type EnrolledProgram = { id: number; title: string; slug: string; track: Track }

const idOf = (v: unknown): number | null =>
  typeof v === 'number'
    ? v
    : typeof v === 'object' && v && 'id' in v
      ? Number((v as { id: unknown }).id)
      : null

/** Is this account allowed any program at all (rules 1 and 2)? */
async function studentInGoodStanding(payload: Payload, account: Account): Promise<boolean> {
  if (account.disabled || account.kind !== 'student') return false
  const applicationId = idOf(account.application)
  if (!applicationId) return false
  const application = await payload
    .findByID({
      collection: 'applications',
      id: applicationId,
      depth: 0,
      overrideAccess: true,
      select: { applicationStatus: true },
    })
    .catch(() => null)
  return application?.applicationStatus === 'accepted'
}

/** May this account enroll at all — an active student whose application is accepted? */
export const canEnroll = cache(async (account: Account): Promise<boolean> =>
  studentInGoodStanding(await getClient(), account),
)

/** The programs this student may open now, open training first. */
export const enrolledPrograms = cache(
  async (account: Account, locale: Locale): Promise<EnrolledProgram[]> => {
    const payload = await getClient()
    if (!(await studentInGoodStanding(payload, account))) return []
    const rows = await payload.find({
      collection: 'enrollments',
      where: { and: [{ account: { equals: account.id } }, { state: { equals: 'enrolled' } }] },
      depth: 1,
      locale,
      fallbackLocale: 'ar',
      limit: 20,
      overrideAccess: true,
    })
    return rows.docs
      .map((r) => (typeof r.program === 'object' && r.program ? (r.program as Program) : null))
      .filter((p): p is Program => !!p && p.status === 'published')
      .map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        track: (p.track ?? 'directed') as Track,
      }))
      .sort((a, b) => Number(b.track === 'open') - Number(a.track === 'open'))
  },
)

/** Every enrollment row of an account, for the program list's states (any state). */
export const enrollmentRows = cache(async (account: Account) => {
  const payload = await getClient()
  const rows = await payload.find({
    collection: 'enrollments',
    where: { account: { equals: account.id } },
    depth: 1,
    limit: 20,
    overrideAccess: true,
  })
  return rows.docs.map((r) => {
    const p = typeof r.program === 'object' && r.program ? (r.program as Program) : null
    return {
      id: r.id,
      programId: idOf(r.program) ?? 0,
      track: ((p?.track as Track | undefined) ?? 'directed') as Track,
      active: r.state === 'enrolled',
    }
  })
})

export type RosterEntry = { id: number; name: string | null; email: string }

/**
 * The students of a program, as a session's register sees them: the same three rules,
 * from the program's side. Used by the staff roster and the Zoom sync, so the register
 * and the window can never disagree about who is in a program.
 */
export async function programRoster(payload: Payload, programId: number): Promise<RosterEntry[]> {
  const rows = await payload.find({
    collection: 'enrollments',
    where: { and: [{ program: { equals: programId } }, { state: { equals: 'enrolled' } }] },
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    select: { account: true },
  })
  const accountIds = rows.docs.map((r) => idOf(r.account)).filter((id): id is number => !!id)
  if (!accountIds.length) return []

  const accounts = await payload.find({
    collection: 'accounts',
    where: {
      and: [
        { id: { in: accountIds } },
        { kind: { equals: 'student' } },
        // Explicit about empty: in SQL `<> true` would silently drop a NULL row.
        { or: [{ disabled: { equals: false } }, { disabled: { exists: false } }] },
      ],
    },
    depth: 0,
    limit: 1000,
    sort: 'name',
    overrideAccess: true,
  })
  const applicationIds = accounts.docs
    .map((a) => idOf(a.application))
    .filter((id): id is number => !!id)
  if (!applicationIds.length) return []

  const accepted = await payload.find({
    collection: 'applications',
    where: {
      and: [{ id: { in: applicationIds } }, { applicationStatus: { equals: 'accepted' } }],
    },
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    select: { applicationStatus: true },
  })
  const ok = new Set(accepted.docs.map((d) => d.id))
  return accounts.docs
    .filter((a) => ok.has(idOf(a.application) ?? -1))
    .map((a) => ({ id: a.id, name: a.name ?? null, email: a.email }))
}
