/**
 * Which badges a student has earned and not yet been given (user decision, 2026-09-24:
 * staff define the badges; each is awarded by hand, or automatically on a rule the site
 * can check). Pure, so the rules are tested on their own.
 *
 *   - `manual`           — only staff award it;
 *   - `sessions`         — attended at least `threshold` sessions (any program, cancelled
 *                          sessions never count);
 *   - `graduated`        — holds a graduation certificate that is not revoked;
 *   - `certificate`      — holds any certificate that is not revoked.
 *
 * Once given, a badge stays: a revoked certificate does not take a badge back — staff
 * remove an award by hand if they mean to.
 */

export type BadgeRule = 'manual' | 'sessions' | 'graduated' | 'certificate'

export type BadgeFacts = { id: number; rule: BadgeRule; threshold?: number | null }

export type StudentFacts = {
  /** Sessions marked present, across programs, cancelled ones excluded. */
  attended: number
  /** Certificates held and not revoked. */
  certificates: number
  /** Of which graduation certificates. */
  graduations: number
}

export function earnedBadges(
  badges: BadgeFacts[],
  facts: StudentFacts,
  alreadyAwarded: number[],
): number[] {
  const has = new Set(alreadyAwarded)
  return badges
    .filter((b) => !has.has(b.id))
    .filter((b) => {
      switch (b.rule) {
        case 'sessions':
          return !!b.threshold && b.threshold > 0 && facts.attended >= b.threshold
        case 'graduated':
          return facts.graduations > 0
        case 'certificate':
          return facts.certificates > 0
        default:
          return false
      }
    })
    .map((b) => b.id)
}
