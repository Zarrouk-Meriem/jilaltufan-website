import { cn } from '@/lib/cn'

export type BadgeTone = 'neutral' | 'muted' | 'accent' | 'live' | 'struck'

const tones: Record<BadgeTone, string> = {
  neutral: 'border border-ink-900 text-ink-900',
  muted: 'bg-paper-2 text-ink-500 border border-line',
  accent: 'bg-red-50 text-red-700 border border-red-50',
  live: 'bg-red-600 text-white border border-red-600',
  struck: 'bg-paper-2 text-ink-500 border border-line line-through',
}

export function Badge({
  tone = 'neutral',
  children,
  className,
  pulse,
}: {
  tone?: BadgeTone
  children: React.ReactNode
  className?: string
  pulse?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-brand px-2.5 text-xs font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {pulse ? <span aria-hidden className="live-dot size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  )
}
