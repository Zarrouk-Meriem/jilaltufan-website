import { describe, expect, it } from 'vitest'
import { shapeArabic } from '@/lib/og-arabic'

/**
 * The OG title shaper. Pinned after the Noto Kufi swap (2026-09-19): opentype.js's own
 * shaper left every letter isolated (unsupported GSUB lookup type), HarfBuzz could not
 * read the WOFF container, and the line box built from the font's ascender clipped
 * every dot below the baseline.
 */
function decode(dataUri: string) {
  return Buffer.from(dataUri.split(',')[1]!, 'base64').toString()
}
function subpaths(svg: string) {
  const d = /d="([^"]+)"/.exec(svg)![1]!
  return d
    .split('M ')
    .filter(Boolean)
    .map((s) => {
      const nums = s.match(/-?\d+\.\d+/g)!.map(Number)
      const xs = nums.filter((_, i) => i % 2 === 0)
      const ys = nums.filter((_, i) => i % 2 === 1)
      return { x1: Math.min(...xs), x2: Math.max(...xs), y1: Math.min(...ys), y2: Math.max(...ys) }
    })
}

describe('shapeArabic', () => {
  it('joins the letters: a three-letter word is not three isolated glyphs', async () => {
    const svg = decode((await shapeArabic('جيل', 48, 700, 400)).dataUri)
    // ج ي ل carry three dot groups: skeleton subpaths plus three dots.
    expect(subpaths(svg).length).toBeGreaterThanOrEqual(6)
  })

  it('keeps the dots below the baseline inside the drawn block', async () => {
    const r = await shapeArabic('جيل', 48, 700, 400)
    const svg = decode(r.dataUri)
    const dy = Number(/translate\([-\d.]+ ([-\d.]+)\)/.exec(svg)![1])
    for (const p of subpaths(svg)) {
      expect(dy + p.y1).toBeGreaterThanOrEqual(-0.5)
      expect(dy + p.y2).toBeLessThanOrEqual(r.height + 0.5)
    }
  })

  it('wraps onto a second line when the width runs out', async () => {
    const one = await shapeArabic('أكاديمية جيل الطوفان', 48, 700, 2000)
    const two = await shapeArabic('أكاديمية جيل الطوفان', 48, 700, 200)
    expect(two.height).toBeGreaterThan(one.height)
    expect((decode(two.dataUri).match(/<path /g) ?? []).length).toBe(3)
  })
})
