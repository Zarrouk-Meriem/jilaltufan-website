import Image from 'next/image'
import { cn } from '@/lib/cn'
import { Mark } from './Mark'

type Props = {
  locale: string
  /** `light` = on paper (ink wordmark); `dark` = on navy (white wordmark). */
  surface?: 'light' | 'dark'
  /** Rendered height in px. */
  height?: number
  className?: string
  priority?: boolean
}

const RATIO = 363.9 / 200.34

/**
 * The lockup. Arabic uses the designer's SVG (/public/brand/logo.svg, white wordmark
 * variant for navy). English has no supplied lockup yet, so it is the mark plus a
 * type-set "Jil Altufan Academy" in Poppins until the designer delivers one.
 */
export function Logo({ locale, surface = 'light', height = 56, className, priority }: Props) {
  if (locale === 'ar') {
    const src = surface === 'dark' ? '/brand/logo-on-dark.svg' : '/brand/logo.svg'
    return (
      <Image
        src={src}
        alt=""
        width={Math.round(height * RATIO)}
        height={height}
        priority={priority}
        className={cn('block h-auto w-auto', className)}
        style={{ height, width: 'auto' }}
      />
    )
  }
  const ink = surface === 'dark' ? 'text-on-navy' : 'text-ink-900'
  return (
    <span className={cn('inline-flex items-center gap-3', ink, className)} style={{ height }}>
      <Mark size={height} />
      <span className="flex flex-col justify-center leading-none" lang="en" dir="ltr">
        <span className="eyebrow-latin text-[0.55em]" style={{ fontSize: height * 0.2 }}>
          Academy
        </span>
        <span
          className="font-bold uppercase"
          style={{ fontSize: height * 0.34, letterSpacing: '0.02em', lineHeight: 1.05 }}
        >
          Jil Altufan
        </span>
      </span>
    </span>
  )
}
