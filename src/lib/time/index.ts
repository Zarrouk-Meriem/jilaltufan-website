/**
 * All time display goes through here. Sessions are stored in UTC; the primary
 * display is the academy zone (SiteSettings, default Asia/Hebron) labelled
 * «بتوقيت القدس» / "Al-Quds time"; the visitor's zone is added on the client.
 * Digits are always Western (latn), matching the brand's posts.
 */
export const DEFAULT_TZ = 'Asia/Hebron'

export type SessionState = 'upcoming' | 'starting-soon' | 'live' | 'completed' | 'cancelled'

export type SessionTiming = {
  startsAt: string | Date
  durationMinutes?: number | null
  sessionStatus?: 'scheduled' | 'cancelled' | 'completed' | null
}

const toDate = (d: string | Date) => (d instanceof Date ? d : new Date(d))

export function getSessionState(
  s: SessionTiming,
  now: Date = new Date(),
  windowMinutes = 30,
): SessionState {
  if (s.sessionStatus === 'cancelled') return 'cancelled'
  if (s.sessionStatus === 'completed') return 'completed'
  const start = toDate(s.startsAt).getTime()
  const end = start + (s.durationMinutes ?? 90) * 60_000
  const t = now.getTime()
  if (t >= end) return 'completed'
  if (t >= start) return 'live'
  if (t >= start - windowMinutes * 60_000) return 'starting-soon'
  return 'upcoming'
}

/** Milliseconds until the next state boundary (for client refresh), or null when settled. */
export function msUntilNextBoundary(
  s: SessionTiming,
  now: Date = new Date(),
  windowMinutes = 30,
): number | null {
  if (s.sessionStatus === 'cancelled' || s.sessionStatus === 'completed') return null
  const start = toDate(s.startsAt).getTime()
  const end = start + (s.durationMinutes ?? 90) * 60_000
  const t = now.getTime()
  const boundaries = [start - windowMinutes * 60_000, start, end].filter((b) => b > t)
  return boundaries.length ? boundaries[0]! - t : null
}

type Parts = {
  day: string
  month: string
  monthShort: string
  weekday: string
  time: string
  date: string
  dateTime: string
  year: string
}

// English uses day–month–year (en-GB); Arabic stays ar. Digits always Western.
const INTL: Record<string, string> = { ar: 'ar', en: 'en-GB' }
const intlLocale = (locale: string) => `${INTL[locale] ?? locale}-u-nu-latn`

export function formatInZone(
  d: string | Date,
  locale: string,
  timeZone: string = DEFAULT_TZ,
): Parts {
  const date = toDate(d)
  const f = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(intlLocale(locale), { timeZone, ...opts }).format(date)
  return {
    day: f({ day: 'numeric' }),
    month: f({ month: 'long' }),
    monthShort: f({ month: 'short' }),
    weekday: f({ weekday: 'long' }),
    year: f({ year: 'numeric' }),
    time: f({ hour: '2-digit', minute: '2-digit', hour12: false }),
    date: f({ day: 'numeric', month: 'long', year: 'numeric' }),
    dateTime: f({
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  }
}

/** Month key used by the season timeline, in the academy zone. */
export function monthKeyInZone(d: string | Date, timeZone: string = DEFAULT_TZ): string {
  const p = new Intl.DateTimeFormat('en-u-nu-latn', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(toDate(d))
  const y = p.find((x) => x.type === 'year')?.value
  const m = p.find((x) => x.type === 'month')?.value
  return `${y}-${m}`
}

/** The eight season months (Sep → Apr) as YYYY-MM keys for a season starting in `startYear`. */
/**
 * The academy year per the founding paper: open training October → May, directed
 * programs January → June, graduation projects and the camp in September.
 */
export const SEASON_START_MONTH = 10
export const SEASON_END_MONTH = 6
export const SEASON_LENGTH = 9

export function seasonMonthKeys(
  startYear: number,
  startMonth = SEASON_START_MONTH,
  count = SEASON_LENGTH,
): string[] {
  return Array.from({ length: count }, (_, i) => {
    const m0 = startMonth - 1 + i
    const y = startYear + Math.floor(m0 / 12)
    const m = (m0 % 12) + 1
    return `${y}-${String(m).padStart(2, '0')}`
  })
}

/** Season that contains `now` in the academy zone: Sep→Apr belongs to the year it started. */
export function currentSeasonStartYear(
  now: Date = new Date(),
  timeZone: string = DEFAULT_TZ,
  startMonth = SEASON_START_MONTH,
  endMonth = SEASON_END_MONTH,
): number {
  const [y, m] = monthKeyInZone(now, timeZone).split('-').map(Number) as [number, number]
  // After the season ends (July → September) the coming season is the one to show.
  return m >= startMonth || m > endMonth ? y : y - 1
}
