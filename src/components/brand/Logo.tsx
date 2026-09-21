import Image from 'next/image'
import { cn } from '@/lib/cn'

type Props = {
  locale: string
  /** `light` = on paper (ink wordmark); `dark` = on navy (white wordmark). */
  surface?: 'light' | 'dark'
  /** Rendered height in px. */
  height?: number
  className?: string
  priority?: boolean
}

/** viewBox ratios of the two lockups; both sit on the designer's 364 × 196 grid. */
const RATIO = { ar: 363.9 / 200.34, en: 362.85 / 195.82 } as const

/**
 * The lockup, the designer's SVGs: Arabic (2026-09-19) and English (2026-09-21), each
 * with a white-wordmark variant for navy. The English type is outlined from Inter Black
 * and JetBrains Mono SemiBold, so the file needs no fonts. Composition mirrors: the
 * mark sits on the outer side in each reading direction.
 */
export function Logo({ locale, surface = 'light', height = 56, className, priority }: Props) {
  const lang = locale === 'ar' ? 'ar' : 'en'
  const file = lang === 'ar' ? 'logo' : 'logo-en'
  const src = surface === 'dark' ? `/brand/${file}-on-dark.svg` : `/brand/${file}.svg`
  return (
    <Image
      src={src}
      alt=""
      width={Math.round(height * RATIO[lang])}
      height={height}
      priority={priority}
      className={cn('block h-auto w-auto', className)}
      style={{ height, width: 'auto' }}
    />
  )
}
