/**
 * Arabic text for OG images, shaped by opentype.js (init/medi/fina forms + bidi
 * reordering) and emitted as SVG paths with measured ink widths — because Satori
 * measures Arabic with unshaped advances and pads every word.
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as opentypeNs from 'opentype.js'

// Turbopack exposes opentype's functions at the top level; plain Node ESM puts them on `.default`.
const opentype = ((opentypeNs as unknown as { default?: typeof opentypeNs }).default ??
  opentypeNs) as typeof opentypeNs

const dir = join(process.cwd(), 'src/app/(frontend)/api/og/fonts')
const cache = new Map<string, Promise<opentype.Font>>()
function font(weight: 400 | 700) {
  const file = weight === 700 ? 'IBMPlexSansArabic-Bold.ttf' : 'IBMPlexSansArabic-Regular.ttf'
  let p = cache.get(file)
  if (!p) {
    p = readFile(join(dir, file)).then((b) =>
      opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)),
    )
    cache.set(file, p)
  }
  return p
}

type Tok = { d: string; w: number; x1: number }

/**
 * Explicit path serialisation: opentype's toPathData() emits compact number runs
 * ("62.06-2.20", ".5") that resvg and Satori parse differently, which showed up
 * as glyphs dropped or mangled depending on their x offset.
 */
function serialize(cmds: Array<Record<string, unknown>>): string {
  const n = (v: unknown) => (typeof v === 'number' ? v.toFixed(2) : '0')
  return cmds
    .map((c) => {
      switch (c.type) {
        case 'M':
          return `M ${n(c.x)} ${n(c.y)}`
        case 'L':
          return `L ${n(c.x)} ${n(c.y)}`
        case 'Q':
          return `Q ${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`
        case 'C':
          return `C ${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`
        case 'Z':
          return 'Z'
        default:
          return ''
      }
    })
    .join(' ')
}

/** Shape one token on its own (pure-Arabic words join correctly; numbers and dashes stay as-is). */
// Drawn at an x offset on purpose: both resvg and Satori drop the trailing subpaths of a shaped
// Arabic word whose path starts at x≈0 (reproduced with opentype.js 2.0; cause unknown). The
// placement below uses the absolute bounding box, so the offset cancels out.
const DRAW_OFFSET = 100
function token(f: opentype.Font, text: string, size: number): Tok {
  const p = f.getPath(text, DRAW_OFFSET, 0, size)
  // getBoundingBox() under-reports the extent of some final glyphs; command extents
  // (control points included) bound the curves and cannot under-report.
  let x1 = Infinity
  let x2 = -Infinity
  for (const c of p.commands as Array<Record<string, unknown>>) {
    for (const k of ['x', 'x1', 'x2']) {
      const v = c[k]
      if (typeof v === 'number') {
        x1 = Math.min(x1, v)
        x2 = Math.max(x2, v)
      }
    }
  }
  if (!Number.isFinite(x1)) x1 = x2 = DRAW_OFFSET
  return { d: serialize(p.commands as Array<Record<string, unknown>>), w: Math.max(0, x2 - x1), x1 }
}

export type ShapedBlock = { dataUri: string; width: number; height: number }

/**
 * Shape Arabic text into one SVG: words placed right-to-left with measured ink
 * widths and a fixed gap, wrapping onto new lines when the width runs out.
 * opentype.js is asked to shape single words only — its cross-run bidi is not
 * trusted (it mis-orders mixed Arabic/number lines).
 */
export async function shapeArabic(
  text: string,
  size: number,
  weight: 400 | 700,
  maxWidth: number,
  color = '#ffffff',
  lineHeight = 1.35,
): Promise<ShapedBlock> {
  const f = await font(weight)
  const gap = size * 0.28
  const lh = size * lineHeight
  const ascent = size * (f.ascender / f.unitsPerEm)
  const toks = text
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => token(f, t, size))
  const lines: Tok[][] = [[]]
  let x = maxWidth
  for (const t of toks) {
    const line = lines[lines.length - 1]!
    if (line.length && x - t.w < 0) {
      lines.push([t])
      x = maxWidth - t.w - gap
    } else {
      line.push(t)
      x -= t.w + gap
    }
  }
  const paths: string[] = []
  lines.forEach((line, i) => {
    let right = maxWidth
    const dy = ascent + i * lh
    for (const t of line) {
      const dx = right - t.w - t.x1
      paths.push(
        `<path transform="translate(${dx.toFixed(2)} ${dy.toFixed(2)})" fill="${color}" d="${t.d}"/>`,
      )
      right -= t.w + gap
    }
  })
  const height = Math.ceil(lines.length * lh)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${maxWidth}" height="${height}" viewBox="0 0 ${maxWidth} ${height}">${paths.join('')}</svg>`
  return {
    dataUri: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    width: maxWidth,
    height,
  }
}
