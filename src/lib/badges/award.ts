import type { Locale } from '@/i18n/routing'
import type { Account, Badge } from '@/payload-types'
import { getClient } from '@/lib/queries/client'
import { earnedBadges, type BadgeRule } from './earned'

const idOf = (v: unknown): number | null =>
  typeof v === 'number'
    ? v
    : typeof v === 'object' && v && 'id' in v
      ? Number((v as { id: unknown }).id)
      : null

export type BadgeView = {
  id: number
  name: string
  description: string
  icon: string
  rule: BadgeRule
  threshold: number | null
  /** When this student received it; null when not (yet) earned. */
  awardedAt: string | null
}

/**
 * Gives a student the automatic badges they have earned, then returns every published
 * badge with whether they hold it — earned first, then the rest in the academy's order.
 * Run when they open the page that shows badges, like certificates: no scheduler.
 */
export async function studentBadges(account: Account, locale: Locale): Promise<BadgeView[]> {
  if (account.kind !== 'student') return []
  const payload = await getClient()
  const [badges, awards, attended, certificates, graduations] = await Promise.all([
    payload.find({
      collection: 'badges',
      where: { status: { equals: 'published' } },
      sort: 'order',
      depth: 0,
      limit: 100,
      locale,
      fallbackLocale: 'ar',
      overrideAccess: true,
    }),
    payload.find({
      collection: 'badge-awards',
      where: { account: { equals: account.id } },
      depth: 0,
      limit: 100,
      overrideAccess: true,
    }),
    payload.count({
      collection: 'attendance',
      where: {
        and: [
          { account: { equals: account.id } },
          { state: { equals: 'present' } },
          { 'session.sessionStatus': { not_equals: 'cancelled' } },
        ],
      },
      overrideAccess: true,
    }),
    payload.count({
      collection: 'certificates',
      where: { and: [{ account: { equals: account.id } }, { revoked: { not_equals: true } }] },
      overrideAccess: true,
    }),
    payload.count({
      collection: 'certificates',
      where: {
        and: [
          { account: { equals: account.id } },
          { kind: { equals: 'graduation' } },
          { revoked: { not_equals: true } },
        ],
      },
      overrideAccess: true,
    }),
  ])

  const held = new Map(awards.docs.map((a) => [idOf(a.badge), a.awardedAt]))
  const due = earnedBadges(
    badges.docs.map((b) => ({ id: b.id, rule: b.rule as BadgeRule, threshold: b.threshold })),
    {
      attended: attended.totalDocs,
      certificates: certificates.totalDocs,
      graduations: graduations.totalDocs,
    },
    [...held.keys()].filter((id): id is number => id !== null),
  )
  for (const badge of due) {
    const awardedAt = new Date().toISOString()
    try {
      await payload.create({
        collection: 'badge-awards',
        data: { account: account.id, badge, source: 'rule', awardedAt },
        overrideAccess: true,
      })
      held.set(badge, awardedAt)
    } catch (err) {
      // Two tabs at once: the unique index lets one through.
      payload.logger.warn({ err, msg: 'badge not awarded', account: account.id, badge })
    }
  }

  const view = (b: Badge): BadgeView => ({
    id: b.id,
    name: b.name,
    description: b.description,
    icon: b.icon,
    rule: b.rule as BadgeRule,
    threshold: b.threshold ?? null,
    awardedAt: held.get(b.id) ?? null,
  })
  const all = badges.docs.map(view)
  return [...all.filter((b) => b.awardedAt), ...all.filter((b) => !b.awardedAt)]
}
