import { cn } from '@/lib/cn'

/** Day / month / weekday block used in session rows. Digits are always Western. */
export function DateBlock({
  day,
  month,
  weekday,
  tone = 'paper',
  className,
}: {
  day: string
  month: string
  weekday?: string
  tone?: 'paper' | 'navy'
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex w-16 shrink-0 flex-col items-center justify-center rounded-brand border py-2 text-center leading-none',
        tone === 'paper' ? 'border-line bg-paper text-ink-900' : 'border-on-navy-line text-on-navy',
        className,
      )}
    >
      <span className="text-2xl font-bold tabular-nums">{day}</span>
      <span
        className={cn('mt-1 text-xs', tone === 'paper' ? 'text-ink-500' : 'text-on-navy-muted')}
      >
        {month}
      </span>
      {weekday ? (
        <span
          className={cn(
            'mt-0.5 text-[0.65rem]',
            tone === 'paper' ? 'text-ink-500' : 'text-on-navy-muted',
          )}
        >
          {weekday}
        </span>
      ) : null}
    </div>
  )
}
