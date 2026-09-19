/**
 * Arabic text for OG images, shaped by HarfBuzz (joining forms, ligatures, mark
 * placement) and drawn with opentype.js glyph outlines, emitted as SVG paths with
 * measured ink widths — because Satori measures Arabic with unshaped advances and
 * pads every word.
 *
 * Why two libraries: opentype.js can parse the font and draw any glyph, but its own
 * shaper only implements a few GSUB lookup types and Noto Kufi Arabic builds its
 * joining forms with one it lacks (multiple substitution), so it drew every letter
 * isolated. HarfBuzz is the reference shaper; it returns glyph ids and positions,
 * and opentype.js turns those ids into paths in the coordinate system Satori expects.
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { inflateSync } from 'node:zlib'
import * as hb from 'harfbuzzjs'
import * as opentypeNs from 'opentype.js'

// Turbopack exposes opentype's functions at the top level; plain Node ESM puts them on `.default`.
const opentype = ((opentypeNs as unknown as { default?: typeof opentypeNs }).default ??
  opentypeNs) as typeof opentypeNs

const dir = join(process.cwd(), 'src/app/(frontend)/api/og/fonts')

/**
 * HarfBuzz reads plain SFNT (TTF/OTF) only, and the font ships as WOFF 1.0: the same
 * tables, zlib-compressed, behind a different directory. Unpack it in memory so both
 * libraries see identical bytes and therefore identical glyph ids.
 */
function woffToSfnt(woff: ArrayBuffer): ArrayBuffer {
  const src = Buffer.from(woff)
  if (src.toString('latin1', 0, 4) !== 'wOFF') return woff
  const flavor = src.readUInt32BE(4)
  const numTables = src.readUInt16BE(12)
  const tables = Array.from({ length: numTables }, (_, i) => {
    const o = 44 + i * 20
    return {
      tag: src.subarray(o, o + 4),
      offset: src.readUInt32BE(o + 4),
      compLength: src.readUInt32BE(o + 8),
      origLength: src.readUInt32BE(o + 12),
      checksum: src.readUInt32BE(o + 16),
    }
  })
  const pad4 = (n: number) => (n + 3) & ~3
  let entrySelector = 0
  while (1 << (entrySelector + 1) <= numTables) entrySelector++
  const searchRange = (1 << entrySelector) * 16
  const header = Buffer.alloc(12)
  header.writeUInt32BE(flavor, 0)
  header.writeUInt16BE(numTables, 4)
  header.writeUInt16BE(searchRange, 6)
  header.writeUInt16BE(entrySelector, 8)
  header.writeUInt16BE(numTables * 16 - searchRange, 10)
  const directory = Buffer.alloc(numTables * 16)
  const bodies: Buffer[] = []
  let offset = 12 + directory.length
  tables.forEach((t, i) => {
    const raw = src.subarray(t.offset, t.offset + t.compLength)
    const data = t.compLength === t.origLength ? raw : inflateSync(raw)
    t.tag.copy(directory, i * 16)
    directory.writeUInt32BE(t.checksum, i * 16 + 4)
    directory.writeUInt32BE(offset, i * 16 + 8)
    directory.writeUInt32BE(t.origLength, i * 16 + 12)
    const padded = Buffer.alloc(pad4(data.length))
    data.copy(padded)
    bodies.push(padded)
    offset += padded.length
  })
  const out = Buffer.concat([header, directory, ...bodies])
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength)
}

type Loaded = { outlines: opentype.Font; shaper: hb.Font; upem: number }
const cache = new Map<string, Promise<Loaded>>()
function font(weight: 400 | 700) {
  const file = weight === 700 ? 'NotoKufiArabic-Bold.woff' : 'NotoKufiArabic-Regular.woff'
  let p = cache.get(file)
  if (!p) {
    p = readFile(join(dir, file)).then((b) => {
      const bytes = woffToSfnt(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength))
      const face = new hb.Face(new hb.Blob(bytes))
      return { outlines: opentype.parse(bytes), shaper: new hb.Font(face), upem: face.upem }
    })
    cache.set(file, p)
  }
  return p
}

/** One shaped word: its path, ink width, and ink extents (x1 from the left, y1 above and y2 below the baseline). */
type Tok = { d: string; w: number; x1: number; y1: number; y2: number }

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
function token(f: Loaded, text: string, size: number): Tok {
  const buffer = new hb.Buffer()
  buffer.addText(text)
  buffer.guessSegmentProperties()
  hb.shape(f.shaper, buffer)
  const infos = buffer.getGlyphInfos()
  const positions = buffer.getGlyphPositions()
  // harfbuzzjs frees its objects through a FinalizationRegistry; there is no destroy().

  // HarfBuzz returns glyphs in visual order, left to right, in font units.
  const scale = size / f.upem
  const commands: Array<Record<string, unknown>> = []
  let x = DRAW_OFFSET
  infos.forEach((info, i) => {
    const pos = positions[i]!
    const glyph = f.outlines.glyphs.get(info.codepoint)
    const path = glyph.getPath(x + pos.xOffset * scale, -pos.yOffset * scale, size)
    commands.push(...(path.commands as Array<Record<string, unknown>>))
    x += pos.xAdvance * scale
  })

  // Command extents (control points included) bound the curves and cannot under-report.
  let x1 = Infinity
  let x2 = -Infinity
  let y1 = Infinity
  let y2 = -Infinity
  for (const c of commands) {
    for (const k of ['x', 'x1', 'x2']) {
      const v = c[k]
      if (typeof v === 'number') {
        x1 = Math.min(x1, v)
        x2 = Math.max(x2, v)
      }
    }
    for (const k of ['y', 'y1', 'y2']) {
      const v = c[k]
      if (typeof v === 'number') {
        y1 = Math.min(y1, v)
        y2 = Math.max(y2, v)
      }
    }
  }
  if (!Number.isFinite(x1)) x1 = x2 = DRAW_OFFSET
  if (!Number.isFinite(y1)) y1 = y2 = 0
  return { d: serialize(commands), w: Math.max(0, x2 - x1), x1, y1, y2 }
}

export type ShapedBlock = { dataUri: string; width: number; height: number }

/**
 * Shape Arabic text into one SVG: words placed right-to-left with measured ink
 * widths and a fixed gap, wrapping onto new lines when the width runs out.
 * Words are shaped one at a time: Arabic never joins across a space, and per-word
 * ink widths are what the wrapping needs. The block is sized from the ink, not the
 * font's vertical metrics: Noto Kufi declares an ascender of 1.28 em, and a line box
 * built from it clipped every dot below the baseline (seen 2026-09-19).
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
  // Ink above and below the baseline across the whole block, so no line clips.
  const above = Math.max(0, ...toks.map((t) => -t.y1))
  const below = Math.max(0, ...toks.map((t) => t.y2))
  const paths: string[] = []
  lines.forEach((line, i) => {
    let right = maxWidth
    const dy = above + i * lh
    for (const t of line) {
      const dx = right - t.w - t.x1
      paths.push(
        `<path transform="translate(${dx.toFixed(2)} ${dy.toFixed(2)})" fill="${color}" d="${t.d}"/>`,
      )
      right -= t.w + gap
    }
  })
  const height = Math.ceil(above + (lines.length - 1) * lh + below)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${maxWidth}" height="${height}" viewBox="0 0 ${maxWidth} ${height}">${paths.join('')}</svg>`
  return {
    dataUri: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    width: maxWidth,
    height,
  }
}
