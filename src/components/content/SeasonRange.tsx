import { Icon } from '@/components/icons/Icon'
import { cn } from '@/lib/cn'

/**
 * A program's season, "October → May", with the site's arrow between the two
 * months (it points in the reading direction and mirrors in RTL). Screen readers
 * get `label` — the spoken form, "from October to May" — and never the icon.
 * An arrow character was used before; neither Poppins nor the Arabic subset has
 * U+2190/2192, so it fell through to the system font and, with the Google-served
 * face, fetched two extra font files on every page (2026-09-20).
 */
export function SeasonRange({
  start,
  end,
  label,
  className,
}: {
  start: string
  end: string
  label: string
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center', className)}>
      <span className="sr-only">{label}</span>
      <span aria-hidden className="inline-flex items-center gap-1.5">
        {start}
        <Icon name="arrow" tone="mono" className="size-3.5" />
        {end}
      </span>
    </span>
  )
}
