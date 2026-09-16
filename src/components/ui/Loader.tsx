import { cn } from '@/lib/cn'

type Size = 'sm' | 'md' | 'lg'
type Tone = 'red' | 'white' | 'ink'

const sizes: Record<Size, number> = { sm: 16, md: 32, lg: 48 }

const tones: Record<Tone, string> = {
  red: 'text-red-600',
  white: 'text-on-navy',
  ink: 'text-ink-900',
}

// An equilateral triangle drawn around its centroid, so the spin has no wobble.
// Side 100 → height 86.6; centroid sits a third of the height above the base.
const POINTS = '0,-57.7 50,28.9 -50,28.9'

/**
 * The brand loader: a plain triangle that turns a third of a revolution per beat
 * and breathes as it turns (three-fold symmetry makes the loop seamless). With
 * `label` it is a live status region; without one it is decorative, for use next
 * to text that already says what is happening (a submit button).
 */
export function Loader({
  size = 'md',
  tone = 'red',
  label,
  className,
}: {
  size?: Size
  tone?: Tone
  label?: string
  className?: string
}) {
  const px = sizes[size]
  const svg = (
    <svg
      viewBox="-60 -60 120 120"
      width={px}
      height={px}
      aria-hidden
      className={cn('loader-triangle block shrink-0', tones[tone], !label && className)}
    >
      <polygon points={POINTS} fill="currentColor" />
    </svg>
  )
  if (!label) return svg
  return (
    <span role="status" className={cn('inline-flex items-center gap-3', className)}>
      {svg}
      <span className="sr-only">{label}</span>
    </span>
  )
}
