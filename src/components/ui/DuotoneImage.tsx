import Image, { type ImageProps } from 'next/image'
import { cn } from '@/lib/cn'

/**
 * Navy duotone treatment (reference 07): the photo is desaturated and screened
 * over a navy field, so shadows become navy and highlights stay light. Pure CSS —
 * no pre-processing, and browsers without blend modes just show the plain photo.
 * `treatment="none"` for the camp gallery.
 */
export function DuotoneImage({
  treatment = 'navy',
  dim = 0,
  className,
  alt,
  ...img
}: ImageProps & {
  treatment?: 'navy' | 'none'
  /** 0–1: darken the highlights for text legibility. */
  dim?: number
  className?: string
}) {
  if (treatment === 'none') {
    return <Image alt={alt} className={cn('object-cover', className)} {...img} />
  }
  return (
    <span className={cn('relative block overflow-hidden bg-navy-900', className)}>
      <Image
        alt={alt}
        className="h-full w-full object-cover mix-blend-screen contrast-[1.05] grayscale"
        {...img}
      />
      {dim > 0 ? (
        <span aria-hidden className="absolute inset-0 bg-navy-900" style={{ opacity: dim }} />
      ) : null}
    </span>
  )
}
