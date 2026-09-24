import { Icon, type IconName } from '@/components/icons/Icon'
import type { Locale } from '@/i18n/routing'
import type { BadgeView } from '@/lib/badges/award'
import { formatInZone } from '@/lib/time'
import { cn } from '@/lib/cn'

/**
 * The student's badges: those they hold in full (duo icon, the date it was given), the
 * rest quiet on the recessed paper with how to earn them. Faded by colour and icon tone,
 * never by opacity on text — the words keep their contrast.
 */
export function BadgeGrid({
  badges,
  locale,
  academyZone,
  labels,
}: {
  badges: BadgeView[]
  locale: Locale
  academyZone: string
  labels: { awarded: (date: string) => string; how: (b: BadgeView) => string }
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {badges.map((b) => {
        const held = !!b.awardedAt
        return (
          <li
            key={b.id}
            className={cn(
              'flex gap-4 rounded-brand border p-5',
              held ? 'border-line bg-paper' : 'border-line bg-paper-2',
            )}
          >
            <span
              className={cn(
                'flex size-12 shrink-0 items-center justify-center rounded-brand border',
                held ? 'border-line-strong' : 'border-line text-ink-500',
              )}
            >
              <Icon name={b.icon as IconName} tone={held ? 'duo' : 'mono'} className="size-6" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <p className={cn('text-md font-semibold', held ? 'text-ink-900' : 'text-ink-700')}>
                {b.name}
              </p>
              <p className="text-sm text-ink-700">{b.description}</p>
              <p className={cn('mt-1 text-xs', held ? 'font-medium text-ink-900' : 'text-ink-500')}>
                {held
                  ? labels.awarded(formatInZone(b.awardedAt!, locale, academyZone).date)
                  : labels.how(b)}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
