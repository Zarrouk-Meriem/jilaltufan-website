import { siFacebook, siInstagram, siTelegram, siTiktok, siX, siYoutube } from 'simple-icons'
import { cn } from '@/lib/cn'

/**
 * Brand glyphs for the social fields, the footer's follow row, and links. Every
 * platform Site settings allows comes from simple-icons except LinkedIn, which is no
 * longer published there (its brand guidelines), so its glyph is kept here from the
 * last released path. All render in `currentColor` so the page's tokens colour them;
 * none mirror in RTL (they are logos).
 */
const PATHS = {
  facebook: siFacebook.path,
  instagram: siInstagram.path,
  youtube: siYoutube.path,
  x: siX.path,
  telegram: siTelegram.path,
  tiktok: siTiktok.path,
  linkedin:
    'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
} as const

export type Brand = keyof typeof PATHS

/**
 * One family per group of icons (user feedback, 2026-09-24: the application form mixed
 * a filled Facebook disc, an outlined Instagram, and a filled LinkedIn square).
 * Instagram's own glyph is already an outline; Facebook and LinkedIn are drawn here
 * in the same language: a ring 2.16 thick (Instagram's weight) around the solid
 * letterform, all three in Instagram's rounded-square frame (same shape, user
 * feedback, 2026-09-24).
 * Each entry is a list of paths; `ring` ones use even-odd so the inside stays open.
 */
const RING_SQUARE =
  'M6.5 0h11A6.5 6.5 0 0 1 24 6.5v11a6.5 6.5 0 0 1-6.5 6.5h-11A6.5 6.5 0 0 1 0 17.5v-11A6.5 6.5 0 0 1 6.5 0Zm0 2.16A4.34 4.34 0 0 0 2.16 6.5v11a4.34 4.34 0 0 0 4.34 4.34h11a4.34 4.34 0 0 0 4.34-4.34v-11a4.34 4.34 0 0 0-4.34-4.34Z'
const OUTLINE: Partial<Record<Brand, { d: string; ring?: boolean }[]>> = {
  facebook: [
    { d: RING_SQUARE, ring: true },
    {
      d: 'M10.45 22.4V13.1H8.3v-2.55h2.15V8.7c0-2.3 1.25-3.5 3.35-3.5.8 0 1.55.06 1.95.12v2.3h-1.25c-.95 0-1.35.45-1.35 1.3v1.63h2.5l-.35 2.55h-2.15v9.3Z',
    },
  ],
  instagram: [{ d: siInstagram.path }],
  linkedin: [
    { d: RING_SQUARE, ring: true },
    {
      d: 'M7.2 8.75a1.5 1.5 0 1 1 0-3a1.5 1.5 0 0 1 0 3ZM5.85 9.9h2.7v8.3h-2.7ZM10.55 9.9h2.6v1.15c.45-.8 1.45-1.35 2.7-1.35 2 0 2.75 1.25 2.75 3.4v5.1h-2.7v-4.6c0-1.1-.3-1.7-1.2-1.7-1 0-1.45.7-1.45 1.8v4.5h-2.7Z',
    },
  ],
}

export function BrandIcon({
  brand,
  variant = 'solid',
  className,
}: {
  brand: Brand
  /** `outline` where a group mixes platforms (the application form's social fields). */
  variant?: 'solid' | 'outline'
  className?: string
}) {
  const outline = variant === 'outline' ? OUTLINE[brand] : undefined
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('size-4 shrink-0', className)}
    >
      {outline ? (
        outline.map((p) => <path key={p.d} d={p.d} fillRule={p.ring ? 'evenodd' : undefined} />)
      ) : (
        <path d={PATHS[brand]} />
      )}
    </svg>
  )
}
