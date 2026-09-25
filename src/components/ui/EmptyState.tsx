import { Icon } from '@/components/icons/Icon'
import { cn } from '@/lib/cn'

/** Nothing to show yet: a quiet card that says so, with an optional way forward. */
export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string
  body?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-3 rounded-brand border border-line bg-paper-2 px-6 py-8',
        className,
      )}
    >
      {/* A neutral icon from the site's set, not the mark: the mark is never a small UI
          indicator (CLAUDE.md; found in the UI pass, 2026-09-25). */}
      <Icon name="info" tone="mono" aria-hidden className="size-5 text-ink-500" />
      <p className="font-semibold text-ink-900">{title}</p>
      {body ? <p className="measure text-ink-500">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
