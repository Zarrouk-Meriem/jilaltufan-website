import { cn } from '@/lib/cn'

type Props = {
  /** Height in px; width follows the 675:814 geometry. */
  size?: number
  /** Only two colours are permitted: brand red, or white on red surfaces. */
  tone?: 'red' | 'white'
  className?: string
  title?: string
}

/** The mark — the red arrow "A" from mark.svg. Never distorted, never recoloured. */
export function Mark({ size = 24, tone = 'red', className, title }: Props) {
  const w = Math.round((size * 675) / 814)
  return (
    <svg
      viewBox="0 0 675 814"
      width={w}
      height={size}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      className={cn('inline-block shrink-0', className)}
    >
      {title ? <title>{title}</title> : null}
      <polygon
        points="481,0 675,326 480,326 194,814 0,814"
        fill={tone === 'white' ? 'var(--on-navy)' : 'var(--red-600)'}
      />
    </svg>
  )
}
