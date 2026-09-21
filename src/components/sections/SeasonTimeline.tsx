import { Mark } from '@/components/brand/Mark'
import { cn } from '@/lib/cn'

export type Station = {
  key: string
  label: string
  count: number
  isCurrent: boolean
  isPast: boolean
}

/** The mark's outline (mark.svg geometry), for the stations. */
function StationMark({ height, className }: { height: number; className?: string }) {
  const w = Math.round((height * 675) / 814)
  return (
    <svg
      viewBox="-2 -2 679 818"
      width={w}
      height={height}
      aria-hidden
      className={cn('block shrink-0', className)}
    >
      <polygon
        points="481,0 675,326 480,326 194,814 0,814"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/**
 * The season's months as stations on a rising rhythm: each station is the mark,
 * one step taller than the last, standing on a shared baseline — the timeline is
 * one of the two places the mark appears outside the logo. Past stations are the
 * outline in ink, future ones a hairline, and the current station is the solid
 * red mark (the only red in the band). Vertical rail on mobile.
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
  // Tailwind needs literal class names; the season is 8–12 stations long.
  const cols: Record<number, string> = {
    8: 'md:grid-cols-8',
    9: 'md:grid-cols-9',
    10: 'md:grid-cols-10',
    11: 'md:grid-cols-11',
    12: 'md:grid-cols-12',
  }
  return (
    <ol
      className={cn('relative grid md:items-end', cols[stations.length] ?? 'md:grid-cols-9')}
      aria-label="season"
    >
      {stations.map((s, i) => {
        const height = base + i * step
        const tone = s.isCurrent
          ? 'text-red-600 [&_polygon]:fill-current'
          : s.isPast
            ? 'text-ink-700 [&_polygon]:fill-transparent'
            : 'text-line-strong [&_polygon]:fill-transparent'
        return (
          <li
            key={s.key}
            aria-current={s.isCurrent ? 'date' : undefined}
            className="relative flex items-center gap-5 border-s border-line py-4 ps-6 md:flex-col md:items-start md:gap-0 md:border-s-0 md:border-b md:border-b-ink-900 md:py-0 md:ps-0"
          >
            {/* Desktop: the mark, one step taller per station, on the baseline */}
            <span
              aria-hidden
              className="hidden w-full items-end md:flex"
              style={{ height: height + 8 }}
            >
              <StationMark height={height} className={tone} />
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
