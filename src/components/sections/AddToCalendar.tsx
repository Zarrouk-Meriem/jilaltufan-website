import { Icon } from '@/components/icons/Icon'
import { cn } from '@/lib/cn'

/** Two quiet links: an .ics download and a Google Calendar template. */
export function AddToCalendar({
  icsHref,
  googleHref,
  icsLabel,
  googleLabel,
  className,
}: {
  icsHref: string
  googleHref: string
  icsLabel: string
  googleLabel: string
  className?: string
}) {
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-x-4 gap-y-1 text-sm', className)}>
      <Icon name="calendar-plus" className="size-4 text-navy-800" />
      <a
        href={icsHref}
        className="link-grow relative inline-flex min-h-6 items-center text-ink-700 hover:text-ink-900"
      >
        {icsLabel}
      </a>
      <a
        href={googleHref}
        target="_blank"
        rel="noopener noreferrer"
        className="link-grow relative inline-flex min-h-6 items-center text-ink-700 hover:text-ink-900"
      >
        {googleLabel}
      </a>
    </span>
  )
}
