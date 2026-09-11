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

const RATIO = 1556 / 875

/**
 * The lockup. Arabic uses the supplied Prop-1 PNGs (swap for SVG in /public/brand
 * when the designer delivers them). English has no supplied lockup yet, so it is
 * type-set after reference 03: small ACADEMY over bold FLOOD'S GENERATION.
 */
export function Logo({ locale, surface = 'light', height = 56, className, priority }: Props) {
  if (locale === 'ar') {
    const src = surface === 'dark' ? '/brand/logo-on-dark.png' : '/brand/logo-color.png'
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
          Flood&rsquo;s Generation
        </span>
      </span>
    </span>
  )
}
