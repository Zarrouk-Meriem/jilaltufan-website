import type { ComponentProps } from 'react'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'

/** Inline link whose underline grows from the start edge on hover. */
export function TextLink({
  className,
  tone = 'ink',
  ...rest
}: ComponentProps<typeof Link> & { tone?: 'ink' | 'red' | 'onNavy' }) {
  return (
    <Link
      className={cn(
        'link-grow relative inline-block font-medium',
        tone === 'ink' && 'text-ink-900',
        tone === 'red' && 'text-red-600',
        tone === 'onNavy' && 'text-on-navy',
        className,
      )}
      {...rest}
    />
  )
}
