import { cn } from '@/lib/cn'

/** The signature 48×3 red rule, aligned to the start edge. */
export function RedRule({
  className,
  tone = 'red',
}: {
  className?: string
  tone?: 'red' | 'white'
}) {
  return (
    <span
      aria-hidden
      className={cn('block', tone === 'red' ? 'bg-red-600' : 'bg-on-navy', className)}
      style={{ width: 'var(--rule-w)', height: 'var(--rule-h)' }}
    />
  )
}
