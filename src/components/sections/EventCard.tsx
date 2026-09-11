import { Badge } from '@/components/ui/Badge'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'

export function EventCard({
  href,
  title,
  typeLabel,
  dateLabel,
  location,
  summary,
  isCamp,
  className,
}: {
  href: string
  title: string
  typeLabel: string
  dateLabel: string
  location?: string | null
  summary?: string | null
  isCamp?: boolean
  className?: string
}) {
  return (
    <Link
      href={href as never}
      className={cn(
        'group flex flex-col gap-4 rounded-brand border border-line p-7 transition-[border-color] duration-200 hover:border-ink-900 md:flex-row md:items-start md:gap-10 md:p-8',
        isCamp && 'border-transparent pattern-keffiyeh-navy surface-navy',
        className,
      )}
    >
      <div className="md:w-48 md:shrink-0">
        <Badge
          tone={isCamp ? 'neutral' : 'muted'}
          className={cn(isCamp && 'border-on-navy-line text-on-navy')}
        >
          {typeLabel}
        </Badge>
        <p
          className={cn(
            'mt-3 text-sm tabular-nums',
            isCamp ? 'text-on-navy-muted' : 'text-ink-500',
          )}
        >
          {dateLabel}
        </p>
        {location ? (
          <p className={cn('text-sm', isCamp ? 'text-on-navy-muted' : 'text-ink-500')}>
            {location}
          </p>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className={cn(isCamp ? 'text-2xl text-on-navy' : 'text-lg text-ink-900')}>
          <span className="link-grow relative">{title}</span>
        </h3>
        {summary ? (
          <p className={cn('mt-3 measure', isCamp ? 'text-on-navy-muted' : 'text-ink-700')}>
            {summary}
          </p>
        ) : null}
      </div>
    </Link>
  )
}
