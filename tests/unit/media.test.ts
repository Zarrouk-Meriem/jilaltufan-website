import { describe, expect, it } from 'vitest'
import { mediaImage, toImagePath } from '@/lib/media'
import type { Media } from '@/payload-types'

const base = {
  id: 2,
  alt: 'قبة الصخرة',
  url: '/api/media/file/x.jpg?prefix=media',
  width: 920,
  height: 690,
  updatedAt: '',
  createdAt: '',
} as Media

describe('mediaImage', () => {
  it('returns null for an unpopulated relation or nothing', () => {
    expect(mediaImage(2)).toBeNull()
    expect(mediaImage(null)).toBeNull()
    expect(mediaImage(undefined)).toBeNull()
  })

  it('prefers the requested generated size', () => {
    const m = { ...base, sizes: { card: { url: '/card.jpg', width: 900, height: 675 } } } as Media
    expect(mediaImage(m, 'card')).toEqual({
      src: '/card.jpg',
      width: 900,
      height: 675,
      alt: 'قبة الصخرة',
    })
  })

  it('falls back to the original when the size was not generated (source too small)', () => {
    const m = { ...base, sizes: { hero: { url: null, width: null, height: null } } } as Media
    expect(mediaImage(m, 'hero')).toEqual({
      src: base.url,
      width: 920,
      height: 690,
      alt: 'قبة الصخرة',
    })
  })

  it('strips the origin Payload puts on media URLs so next/image accepts them', () => {
    expect(
      toImagePath('https://jilaltufan-website.vercel.app/api/media/file/x.jpg?prefix=media'),
    ).toBe('/api/media/file/x.jpg?prefix=media')
    expect(toImagePath('/api/media/file/x.jpg')).toBe('/api/media/file/x.jpg')
    const m = { ...base, url: 'http://localhost:3002/api/media/file/x.jpg?prefix=media' } as Media
    expect(mediaImage(m, 'original')?.src).toBe('/api/media/file/x.jpg?prefix=media')
  })
})
