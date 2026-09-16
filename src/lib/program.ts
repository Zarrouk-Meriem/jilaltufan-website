import type { Program } from '@/payload-types'

type T = (key: string, values?: Record<string, string | number | Date>) => string
type P = Pick<Program, 'track' | 'seasonStartMonth' | 'seasonEndMonth' | 'sessionsCount'>

/** "October → May" from the program's own season fields; null when the program has no sessions. */
export function seasonRange(p: P, t: T): string | null {
  if (!p.sessionsCount || !p.seasonStartMonth || !p.seasonEndMonth) return null
  return t('program.seasonRange', {
    start: t(`common.months.${p.seasonStartMonth}`),
    end: t(`common.months.${p.seasonEndMonth}`),
  })
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
