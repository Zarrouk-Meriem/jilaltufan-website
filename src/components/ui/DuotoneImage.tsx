import Image, { type ImageProps } from 'next/image'
import { cn } from '@/lib/cn'

/**
 * Navy duotone treatment (reference 07): the photo is desaturated, pushed in
 * contrast and screened over a navy field, so shadows become navy and highlights
 * stay light. Pure CSS — no pre-processing, and browsers without blend modes just
 * show the plain photo. `treatment="none"` for the camp gallery.
 *
 * `fade` is for a photo that sits under text (the hero): instead of a flat dim it
 * lays navy from the reading side and from the bottom, so the copy sits on a calm
 * field while the photo stays deep and legible on the far side (trial 2026-09-21,
 * the flat dim had washed the photo to grey).
 */
export function DuotoneImage({
  treatment = 'navy',
  dim = 0,
  fade = false,
  className,
  alt,
  ...img
}: ImageProps & {
  treatment?: 'navy' | 'none'
  /** 0–1: darken the highlights for text legibility. */
  dim?: number
  /** Navy gradients from the reading side and the bottom, for text on top. */
  fade?: boolean
  className?: string
}) {
  if (treatment === 'none') {
    return <Image alt={alt} className={cn('object-cover', className)} {...img} />
  }
  return (
    <span className={cn('relative block overflow-hidden bg-navy-900', className)}>
      <Image
        alt={alt}
        className="h-full w-full object-cover opacity-90 mix-blend-screen brightness-95 contrast-[1.2] grayscale"
        {...img}
      />
      {dim > 0 ? (
        <span aria-hidden className="absolute inset-0 bg-navy-900" style={{ opacity: dim }} />
      ) : null}
      {fade ? (
        <>
          <span
            aria-hidden
            className="absolute inset-0 bg-linear-to-r from-navy-800/92 via-navy-800/25 via-60% to-transparent rtl:bg-linear-to-l"
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-linear-to-t from-navy-900/85 to-transparent to-40%"
          />
        </>
      ) : null}
    </span>
  )
}
