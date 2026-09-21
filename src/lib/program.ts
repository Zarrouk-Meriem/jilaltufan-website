import type { Program } from '@/payload-types'

type T = (key: string, values?: Record<string, string | number | Date>) => string
type P = Pick<Program, 'track' | 'seasonStartMonth' | 'seasonEndMonth' | 'sessionsCount'>

/** The season's first and last month names; null when the program has no sessions. */
export function seasonMonths(p: P, t: T): { start: string; end: string } | null {
  if (!p.sessionsCount || !p.seasonStartMonth || !p.seasonEndMonth) return null
  return {
    start: t(`common.months.${p.seasonStartMonth}`),
    end: t(`common.months.${p.seasonEndMonth}`),
  }
}

/**
 * "from October to May", the spoken form of the season. The visible form is
 * `<SeasonRange>`, which draws the site's arrow between the two months; this
 * string is its screen-reader text.
 */
export function seasonRange(p: P, t: T): string | null {
  const m = seasonMonths(p, t)
  return m ? t('program.seasonRange', m) : null
}

/** "6 sessions"; null when the program has none (strategic projects). */
export function sessionsCountLabel(p: P, t: T): string | null {
  return p.sessionsCount ? t('common.sessions', { count: p.sessionsCount }) : null
}

export function trackLabel(track: Program['track'], t: T): string {
  if (track === 'open') return t('home.openTrackLabel')
  if (track === 'projects') return t('home.projectsTrackLabel')
  return t('home.directedTrackLabel')
}
