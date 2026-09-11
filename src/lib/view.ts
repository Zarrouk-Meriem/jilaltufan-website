import type { BadgeTone } from '@/components/ui/Badge'
import type { Locale } from '@/i18n/routing'
import type { Program } from '@/payload-types'
import type { PublicSession } from '@/lib/queries'
import { rel, rels } from '@/lib/relations'
import { googleCalendarUrl } from '@/lib/calendar'
import { formatInZone, getSessionState, msUntilNextBoundary, type SessionState } from '@/lib/time'

type T = (key: string, values?: Record<string, string | number | Date>) => string

export function registrationBadge(
  mode: Program['registrationMode'],
  t: T,
): { label: string; tone: BadgeTone } {
  switch (mode) {
    case 'open':
      return { label: t('status.registrationOpen'), tone: 'neutral' }
    case 'closed':
      return { label: t('status.registrationClosed'), tone: 'muted' }
    default:
      return { label: t('status.registrationApplication'), tone: 'muted' }
  }
}

export const stateKey: Record<SessionState, string> = {
  upcoming: 'status.upcoming',
  'starting-soon': 'status.startingSoon',
  live: 'status.live',
  completed: 'status.completed',
  cancelled: 'status.cancelled',
}

/** Everything a SessionRow needs, computed once on the server. */
export function sessionView(
  s: PublicSession,
  locale: Locale,
  academyZone: string,
  windowMinutes: number,
  t: T,
  now = new Date(),
) {
  const program = rel(s.program)
  const instructors = rels(s.instructors)
  const state = getSessionState(
    { startsAt: s.startsAt, durationMinutes: s.durationMinutes, sessionStatus: s.sessionStatus },
    now,
    windowMinutes,
  )
  return {
    id: s.id,
    iso: s.startsAt,
    parts: formatInZone(s.startsAt, locale, academyZone),
    state,
    stateLabel: t(stateKey[state]),
    title: s.title,
    programTitle: program?.title,
    programHref: program ? `/programs/${program.slug}` : undefined,
    href: program ? `/programs/${program.slug}#session-${s.number}` : undefined,
    instructor: instructors.map((i) => i.name).join('، ') || null,
    number: s.number,
    joinUrl: s.joinUrl,
    calendar: {
      icsHref: `/${locale}/sessions/${s.id}/calendar.ics`,
      googleHref: googleCalendarUrl({
        uid: String(s.id),
        title: program ? `${program.title} — ${s.title}` : s.title,
        description: t('session.calendarDescription', { program: program?.title ?? '' }),
        location: t('session.calendarLocation'),
        start: new Date(s.startsAt),
        end: new Date(new Date(s.startsAt).getTime() + (s.durationMinutes ?? 90) * 60_000),
      }),
      icsLabel: t('session.ics'),
      googleLabel: t('session.google'),
    },
  }
}

/** Milliseconds until the earliest state change among these sessions (for RefreshAtBoundary). */
export function nextBoundaryMs(
  sessions: PublicSession[],
  windowMinutes: number,
  now = new Date(),
): number | null {
  let min: number | null = null
  for (const s of sessions) {
    const ms = msUntilNextBoundary(
      { startsAt: s.startsAt, durationMinutes: s.durationMinutes, sessionStatus: s.sessionStatus },
      now,
      windowMinutes,
    )
    if (ms !== null && (min === null || ms < min)) min = ms
  }
  return min
}

export function ordinalFor(index: number, t: { raw: (key: string) => unknown }): string {
  const list = t.raw('common.ordinals') as string[]
  return list[index] ?? String(index + 1).padStart(2, '0')
}
