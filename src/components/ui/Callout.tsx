import { cn } from '@/lib/cn'

/** The red-50 box from the plan document, with a red start-edge rule. */
export function Callout({
  title,
  children,
  className,
}: {
  title?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-brand border-s-[3px] border-red-600 bg-red-50 px-6 py-5 text-ink-700',
        className,
      )}
    >
      {title ? <p className="mb-2 font-semibold text-ink-900">{title}</p> : null}
      <div className="text-base [&>p+p]:mt-3">{children}</div>
    </div>
  )
}
