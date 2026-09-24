import { describe, expect, it } from 'vitest'
import { cascadeLight, LIT_ZONE } from '@/components/brand/cascade-light'

/**
 * The hero's light must stay on the cascade wherever the pointer is. It used to follow
 * the pointer one-to-one, so a pointer on the copy or the session strip left the
 * cascade unlit, a flat navy outline (user report, 2026-09-24).
 */
describe('cascade light', () => {
  const inZone = ({ px, py }: { px: number; py: number }) =>
    px >= LIT_ZONE.x[0] && px <= LIT_ZONE.x[1] && py >= LIT_ZONE.y[0] && py <= LIT_ZONE.y[1]

  it.each([
    [0, 0],
    [1, 1],
    [1, 0],
    [0, 1],
    [0.5, 0.5],
    [-0.4, 1.7], // pointer past the hero's edge
  ])('keeps the light on the cascade for a pointer at (%s, %s)', (x, y) => {
    for (const flipX of [false, true])
      for (const flipY of [false, true]) expect(inZone(cascadeLight(x, y, flipX, flipY))).toBe(true)
  })

  it('still moves with the pointer', () => {
    expect(cascadeLight(1, 0).px).toBeGreaterThan(cascadeLight(0, 0).px)
    expect(cascadeLight(0, 1).py).toBeGreaterThan(cascadeLight(0, 0).py)
    // Mirrored (English), the pointer moving right moves the light toward the layer's start.
    expect(cascadeLight(1, 0, true).px).toBeLessThan(cascadeLight(0, 0, true).px)
  })

  it('rests near the CSS default when the pointer is at the centre', () => {
    const { px, py } = cascadeLight(0.5, 0.5)
    expect(Math.abs(px - 22)).toBeLessThanOrEqual(10)
    expect(Math.abs(py - 30)).toBeLessThanOrEqual(10)
  })
})
