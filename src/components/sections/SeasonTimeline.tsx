import { Mark } from '@/components/brand/Mark'
import { cn } from '@/lib/cn'

export type Station = {
  key: string
  label: string
  count: number
  isCurrent: boolean
  isPast: boolean
}

/**
 * September → April as eight stations on a rising, stepped rhythm: each station
 * is a vertical stem from a shared baseline, one step taller than the last, with
 * a short cap. Past and current stations are ink, future ones hairline, and the
 * current station's stem is red with the mark at its foot — the one place on the
 * home page where the mark appears outside the logo. Vertical rail on mobile.
 */
export function SeasonTimeline({
  stations,
  sessionsLabel,
}: {
  stations: Station[]
  sessionsLabel: (n: number) => string
}) {
  const step = 14
  const base = 28
  return (
    <ol className="relative grid md:grid-cols-8 md:items-end" aria-label="season">
      {stations.map((s, i) => {
        const height = base + i * step
        const stem = s.isCurrent ? 'bg-red-600' : s.isPast ? 'bg-ink-900' : 'bg-line-strong'
        return (
          <li
            key={s.key}
            aria-current={s.isCurrent ? 'date' : undefined}
            className="relative flex items-center gap-5 border-s border-line py-4 ps-6 md:flex-col md:items-start md:gap-0 md:border-s-0 md:border-b md:border-b-ink-900 md:py-0 md:ps-0"
          >
            {/* Desktop: rising stem + cap */}
            <span
              aria-hidden
              className="hidden w-full items-end md:flex"
              style={{ height: height + 8 }}
            >
              <span className="relative block h-full w-px" style={{ height }}>
                <span className={cn('absolute inset-0', stem)} />
                <span className={cn('absolute -start-0 top-0 h-px w-8', stem)} />
              </span>
            </span>
            {/* Mobile: dot on the rail */}
            <span
              aria-hidden
              className={cn(
                'absolute -start-[5px] top-1/2 size-[9px] -translate-y-1/2 rounded-full md:hidden',
                s.isCurrent
                  ? 'bg-red-600'
                  : s.isPast
                    ? 'bg-ink-900'
                    : 'border border-line-strong bg-paper',
              )}
            />
            <span className="flex min-w-0 flex-col md:py-4">
              <span className="flex items-center gap-2">
                {s.isCurrent ? <Mark size={12} /> : null}
                <span
                  className={cn(
                    'text-md font-semibold',
                    s.isCurrent ? 'text-ink-900' : s.isPast ? 'text-ink-700' : 'text-ink-500',
                  )}
                >
                  {s.label}
                </span>
              </span>
              <span className={cn('text-xs', s.isCurrent ? 'text-red-700' : 'text-ink-500')}>
                {sessionsLabel(s.count)}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
