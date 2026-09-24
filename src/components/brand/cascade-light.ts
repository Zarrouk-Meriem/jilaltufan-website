/**
 * Where the hero's light sits for a pointer position, in % of the cascade layer
 * (before its corner transform). The whole hero maps onto the lit zone and never
 * beyond it: following the pointer one-to-one carried the light onto the copy or the
 * session strip, where the cascade is not, and left the cascade a flat navy outline
 * (user report, 2026-09-24). The zone holds the strokes the masks leave visible, and
 * its centre sits near the rest position (`--px/--py` defaults in `living-mark`).
 */
export const LIT_ZONE = { x: [4, 22], y: [6, 40] } as const

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const lerp = ([a, b]: readonly [number, number], t: number) => a + (b - a) * t

/** `x`/`y` are the pointer's position across the hero, 0–1; flips mirror the layer. */
export function cascadeLight(x: number, y: number, flipX = false, flipY = false) {
  const fx = clamp01(x)
  const fy = clamp01(y)
  return {
    px: lerp(LIT_ZONE.x, flipX ? 1 - fx : fx),
    py: lerp(LIT_ZONE.y, flipY ? 1 - fy : fy),
  }
}
