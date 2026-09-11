import { Mark } from '@/components/brand/Mark'
import { cn } from '@/lib/cn'

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
      <Mark size={20} />
      <p className="font-semibold text-ink-900">{title}</p>
      {body ? <p className="measure text-ink-500">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
