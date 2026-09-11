import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { AddToCalendar } from './AddToCalendar'
import { DateBlock } from '@/components/ui/DateBlock'
import { LocalTime } from '@/components/ui/LocalTime'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import type { SessionState } from '@/lib/time'

const tone: Record<SessionState, BadgeTone> = {
  upcoming: 'neutral',
  'starting-soon': 'accent',
  live: 'live',
  completed: 'muted',
  cancelled: 'struck',
}

export type SessionRowProps = {
  locale: string
  academyZone: string
  iso: string
  parts: { day: string; monthShort: string; weekday: string; time: string }
  state: SessionState
  stateLabel: string
  programTitle?: string
  programHref?: string
  title: string
  instructor?: string | null
  alQudsLabel: string
  localLabel: string
  href?: string
  className?: string
  joinUrl?: string | null
  joinLabel?: string
  calendar?: { icsHref: string; googleHref: string; icsLabel: string; googleLabel: string }
}

/** One session, as a calm row: date block · program + title · time (Al-Quds + local) · state. */
export function SessionRow(p: SessionRowProps) {
  const muted = p.state === 'completed' || p.state === 'cancelled'
  return (
    <div className={cn('flex items-start gap-5 py-5', muted && 'opacity-70', p.className)}>
      <DateBlock day={p.parts.day} month={p.parts.monthShort} weekday={p.parts.weekday} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {p.programTitle ? (
          p.programHref ? (
            <Link
              href={p.programHref as never}
              className="link-grow relative inline-flex min-h-6 items-center self-start text-xs font-medium text-ink-500 hover:text-ink-900"
            >
              {p.programTitle}
            </Link>
          ) : (
            <span className="text-xs font-medium text-ink-500">{p.programTitle}</span>
          )
        ) : null}
        <h3 className="text-md font-semibold text-ink-900">
          {p.href ? (
            <Link href={p.href as never} className="link-grow relative">
              {p.title}
            </Link>
          ) : (
            p.title
          )}
        </h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-700">
          <span>
            <span className="font-medium text-ink-900 tabular-nums">{p.parts.time}</span>{' '}
            <span className="text-ink-500">{p.alQudsLabel}</span>
          </span>
          <LocalTime
            iso={p.iso}
            locale={p.locale}
            academyZone={p.academyZone}
            label={p.localLabel}
          />
          {p.instructor ? <span className="text-ink-500">· {p.instructor}</span> : null}
        </div>
        {p.calendar || p.joinUrl ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2">
            {p.joinUrl && p.joinLabel ? (
              <ButtonLink
                href={p.joinUrl as never}
                size="sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                {p.joinLabel}
              </ButtonLink>
            ) : null}
            {p.calendar ? <AddToCalendar {...p.calendar} /> : null}
          </div>
        ) : null}
      </div>
      <Badge tone={tone[p.state]} pulse={p.state === 'live'} className="mt-1 shrink-0">
        {p.stateLabel}
      </Badge>
    </div>
  )
}
