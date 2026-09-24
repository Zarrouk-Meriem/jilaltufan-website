import { describe, expect, it } from 'vitest'
import { earnedBadges, type BadgeFacts } from '@/lib/badges/earned'

const badges: BadgeFacts[] = [
  { id: 1, rule: 'manual' },
  { id: 2, rule: 'sessions', threshold: 3 },
  { id: 3, rule: 'graduated' },
  { id: 4, rule: 'certificate' },
  { id: 5, rule: 'sessions', threshold: null },
]
const none = { attended: 0, certificates: 0, graduations: 0 }

describe('earnedBadges', () => {
  it('never awards a manual badge by itself', () => {
    expect(
      earnedBadges(badges, { attended: 99, certificates: 9, graduations: 9 }, []),
    ).not.toContain(1)
  })

  it('awards the sessions badge at its threshold, not below', () => {
    expect(earnedBadges(badges, { ...none, attended: 2 }, [])).toEqual([])
    expect(earnedBadges(badges, { ...none, attended: 3 }, [])).toEqual([2])
  })

  it('a sessions badge with no threshold set awards nothing', () => {
    expect(earnedBadges([badges[4]!], { ...none, attended: 50 }, [])).toEqual([])
  })

  it('an attendance certificate earns the certificate badge but not the graduation one', () => {
    expect(earnedBadges(badges, { ...none, certificates: 1 }, [])).toEqual([4])
    expect(earnedBadges(badges, { ...none, certificates: 1, graduations: 1 }, [])).toEqual([3, 4])
  })

  it('never awards a badge twice', () => {
    expect(
      earnedBadges(badges, { attended: 5, certificates: 1, graduations: 1 }, [2, 3, 4]),
    ).toEqual([])
  })
})
