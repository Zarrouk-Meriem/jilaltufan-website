import type { Media } from '@/payload-types'

export type MediaRef = number | Media | null | undefined
export type MediaSize = 'thumbnail' | 'card' | 'hero' | 'original'

/** Props for next/image from a media relation, or null when there is nothing to show. */
export type ImageSource = { src: string; width: number; height: number; alt: string }

/**
 * Resolve a Payload upload relation to image props. Prefers the requested generated
 * size (Media `imageSizes`: thumbnail 400, card 900, hero 1920); a size that was not
 * generated — the source was smaller than it — falls back to the original file.
 * An unpopulated relation (a bare id) yields null: the query did not ask for depth.
 */
/**
 * Payload builds media URLs on `serverURL`, so they come back absolute
 * (`https://host/api/media/file/x.jpg?prefix=media`). next/image only accepts
 * same-origin *paths* under `images.localPatterns`; an absolute URL is refused with
 * `"url" parameter is not allowed`. Keep the path and query, drop the origin.
 */
export function toImagePath(url: string): string {
  const m = /^https?:\/\/[^/]+(\/.*)$/.exec(url)
  return m ? m[1]! : url
}

export function mediaImage(ref: MediaRef, size: MediaSize = 'card'): ImageSource | null {
  if (!ref || typeof ref === 'number') return null
  const pick = size !== 'original' ? ref.sizes?.[size] : undefined
  const candidate = pick?.url && pick.width && pick.height ? pick : ref
  if (!candidate.url || !candidate.width || !candidate.height) return null
  return {
    src: toImagePath(candidate.url),
    width: candidate.width,
    height: candidate.height,
    alt: ref.alt,
  }
}
