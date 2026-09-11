import { cn } from '@/lib/cn'

/** «أولًا · ثانيًا…» / “01 · 02…” — small labels in the manner of the plan document. */
export function OrdinalLabel({
  children,
  locale,
  className,
}: {
  children: React.ReactNode
  locale: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'block text-ink-500',
        locale === 'ar' ? 'text-sm font-medium' : 'eyebrow-latin',
        className,
      )}
    >
      {children}
    </span>
  )
}
