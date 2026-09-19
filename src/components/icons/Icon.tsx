import type { SVGProps } from 'react'
import { cn } from '@/lib/cn'

/**
 * The site's icon set, drawn in the stencil language the academy chose (2026-09-19):
 * a 24-unit grid, sharp corners everywhere (mitred joins, butt caps, no rounding),
 * heavy geometric shapes, and two tones. The body takes `currentColor`; the accent
 * takes `--icon-accent`, which is brand red by default and white on navy surfaces
 * (`tokens.css`, `surface-navy`). `tone="mono"` folds the accent into the body for
 * icons inside buttons and other places where red is not wanted.
 *
 * Directional icons mirror in RTL through `direction`; everything else keeps its
 * orientation (media controls, files, the globe).
 */

// Geometry helpers. Everything is a path, so the whole set shares one rendering
// model: filled blocks, and strokes with mitred joins (a self-overlapping stroke
// paints once, so bars may cross without punching holes).
const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h${-w}z`
const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`

type Layer = {
  /** Filled subpaths. */
  fill?: string
  /** Stroked subpaths (outlines, bars, chevrons). */
  stroke?: string
  /** Stroke width; 2.5 for outlines, 3 for bars and chevrons that must read at 16 px. */
  width?: number
}

type Glyph = {
  body: Layer
  accent?: Layer
  /** Applied to the whole glyph, e.g. a rotation. */
  transform?: string
  /** Mirror in RTL regardless of `direction`. */
  mirror?: boolean
}

const RING = circle(12, 12, 9)
const ARROW: Glyph = {
  body: { fill: rect(3, 10.5, 15, 3) },
  accent: { stroke: 'M12 4l8 8-8 8', width: 3 },
}
const TRAY = 'M4 15v5h16v-5'
const CALENDAR_FRAME = `${rect(3, 5, 18, 16)}`
const CALENDAR_POSTS = `${rect(7, 2, 2.5, 5)}${rect(14.5, 2, 2.5, 5)}`
const CALENDAR_BAND = rect(1.75, 3.75, 20.5, 6.25)

export const ICONS = {
  /* Direction — mirror in RTL */
  arrow: ARROW,
  'arrow-diagonal': { ...ARROW, transform: 'rotate(-45 12 12)', mirror: true },
  external: {
    body: { stroke: 'M11 4H4v16h16v-7' },
    accent: { stroke: 'M14 4h6v6M20 4l-9.5 9.5' },
    mirror: true,
  },
  chevron: { body: { stroke: 'M4 8l8 8 8-8', width: 3 } },

  /* Interface — single tone by nature */
  close: { body: { stroke: 'M5 5l14 14M19 5L5 19', width: 3 } },
  menu: { body: { stroke: 'M3 6h18M3 12h18M3 18h18', width: 3 } },
  check: { body: { stroke: 'M4 12.5l5 5L20 6.5', width: 3 } },
  plus: { body: { stroke: 'M12 4v16M4 12h16', width: 3 } },
  minus: { body: { stroke: 'M4 12h16', width: 3 } },

  /* Interface — two tones */
  'check-circle': { body: { stroke: RING }, accent: { stroke: 'M7.5 12.5l3 3 6-6', width: 3 } },
  search: {
    body: { stroke: circle(10.5, 10.5, 6.5) },
    accent: { stroke: 'M15.5 15.5L21 21', width: 3 },
  },
  filter: {
    body: { stroke: 'M3 4h18l-7 8v7l-4 2v-9z' },
    accent: { fill: rect(1.75, 2.75, 20.5, 4) },
  },

  /* Content */
  book: {
    body: { stroke: 'M12 6L9 4H3v14h6l3 2 3-2h6V4h-6z' },
    accent: { fill: rect(10.5, 6, 3, 14) },
  },
  calendar: {
    body: { stroke: CALENDAR_FRAME, fill: CALENDAR_POSTS },
    accent: { fill: CALENDAR_BAND },
  },
  'calendar-plus': {
    body: { stroke: CALENDAR_FRAME, fill: CALENDAR_POSTS + CALENDAR_BAND },
    accent: { stroke: 'M12 11.5v7M8.5 15h7', width: 3 },
  },
  clock: { body: { stroke: RING }, accent: { stroke: 'M12 7v5.5h4' } },
  compass: { body: { stroke: RING }, accent: { fill: 'M16.5 7.5L14 14l-6.5 2.5L10 10z' } },
  target: { body: { stroke: RING }, accent: { fill: circle(12, 12, 4) } },
  graduation: {
    body: { fill: 'M12 4L2 9l10 5 10-5z', stroke: 'M6 11.5v5l6 3 6-3v-5' },
    accent: { fill: rect(19.75, 9, 2.5, 7) },
  },
  lock: {
    body: { stroke: `M7.5 11V8a4.5 4.5 0 0 1 9 0v3${rect(4, 11, 16, 10)}` },
    accent: { fill: circle(12, 15.25, 2) + rect(10.75, 15.25, 2.5, 4) },
  },
  file: { body: { stroke: 'M14 3H5v18h14V8zM14 3v5h5' }, accent: { stroke: 'M8 13h8M8 17h8' } },
  download: {
    body: { stroke: TRAY },
    accent: { stroke: 'M12 3v11M6.5 8.5l5.5 5.5 5.5-5.5', width: 3 },
  },
  upload: {
    body: { stroke: TRAY },
    accent: { stroke: 'M12 16V4.5M6.5 10L12 4.5l5.5 5.5', width: 3 },
  },
  video: { body: { stroke: rect(3, 6, 13, 12) }, accent: { fill: 'M16 10l5-3v10l-5-3z' } },
  'map-pin': {
    body: { stroke: 'M12 21L5 12V9a7 7 0 0 1 14 0v3z' },
    accent: { fill: circle(12, 9, 2.5) },
  },
  globe: {
    body: { stroke: `${RING}M3 12h18` },
    accent: { stroke: 'M12 3a4 9 0 0 0 0 18a4 9 0 0 0 0-18z' },
  },
  mail: { body: { stroke: rect(3, 5, 18, 14) }, accent: { stroke: 'M3 6.5l9 6.5 9-6.5' } },
  phone: {
    body: { fill: 'M5 3h4l2 5-2.5 1.5c1 3.5 3.5 6 7 7L17 14l5 2v4l-1 1C11 21 3 13 3 4z' },
    accent: { stroke: 'M14.5 4a6 6 0 0 1 5.5 5.5' },
  },
  user: { body: { stroke: 'M4 21v-3l4-4h8l4 4v3' }, accent: { fill: circle(12, 7.5, 4) } },
  users: {
    body: { stroke: 'M2 20v-2.5l3-3h6l3 3V20M15 14.5h2l3 3V20' },
    accent: { fill: circle(8, 8.5, 3.25) + circle(16.5, 9, 2.75) },
  },
  info: {
    body: { stroke: RING },
    accent: { fill: circle(12, 8, 1.5) + rect(10.75, 10.5, 2.5, 6.5) },
  },
  alert: {
    body: { stroke: 'M12 3.5L2.5 20.5h19z' },
    accent: { fill: rect(10.75, 8.5, 2.5, 6) + circle(12, 17.4, 1.4) },
  },
  quote: {
    body: { fill: 'M4 6h7v7l-3 5H5l3-5H4z' },
    accent: { fill: 'M13 6h7v7l-3 5h-3l3-5h-4z' },
    mirror: true,
  },
  award: { body: { fill: 'M8 13l-2.5 8 6.5-3 6.5 3L16 13z' }, accent: { fill: circle(12, 9, 6) } },
  share: {
    body: { stroke: 'M8 11H5v10h14V11h-3' },
    accent: { stroke: 'M12 15V3.5M7.5 8L12 3.5 16.5 8', width: 3 },
  },
  play: { body: { stroke: RING }, accent: { fill: 'M9.5 7.5l7 4.5-7 4.5z' } },
  home: { body: { stroke: 'M4 11l8-7 8 7v9H4z' }, accent: { fill: rect(10, 14, 4, 6.5) } },
} satisfies Record<string, Glyph>

export type IconName = keyof typeof ICONS

/**
 * Where a directional icon points, in writing direction: `forward` is the reading
 * direction (right in LTR, left in RTL), `back` the opposite. Chevrons default to
 * `down`; arrows default to `forward`.
 */
export type Direction = 'forward' | 'back' | 'up' | 'down'

const DIRECTION: Record<IconName & ('arrow' | 'chevron'), Record<Direction, string>> = {
  arrow: {
    forward: 'rtl:-scale-x-100',
    back: '-scale-x-100 rtl:scale-x-100',
    up: '-rotate-90',
    down: 'rotate-90',
  },
  chevron: {
    down: '',
    up: 'rotate-180',
    forward: '-rotate-90 rtl:rotate-90',
    back: 'rotate-90 rtl:-rotate-90',
  },
}

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'name'> & {
  name: IconName
  /** `duo` (default) paints the accent in `--icon-accent`; `mono` paints it in `currentColor`. */
  tone?: 'duo' | 'mono'
  /** Only `arrow` and `chevron` honour it. */
  direction?: Direction
}

function LayerPaths({ layer }: { layer: Layer }) {
  return (
    <>
      {layer.fill ? <path d={layer.fill} fill="currentColor" /> : null}
      {layer.stroke ? (
        <path d={layer.stroke} fill="none" stroke="currentColor" strokeWidth={layer.width ?? 2.5} />
      ) : null}
    </>
  )
}

export function Icon({ name, tone = 'duo', direction, className, ...rest }: IconProps) {
  const glyph: Glyph = ICONS[name]
  const dir =
    name === 'arrow' || name === 'chevron'
      ? DIRECTION[name][direction ?? (name === 'arrow' ? 'forward' : 'down')]
      : undefined
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width={24}
      height={24}
      strokeLinejoin="miter"
      strokeLinecap="butt"
      className={cn(
        'shrink-0',
        tone === 'mono' && 'icon-mono',
        glyph.mirror && 'rtl:-scale-x-100',
        dir,
        className,
      )}
      {...rest}
    >
      <g transform={glyph.transform}>
        <LayerPaths layer={glyph.body} />
        {glyph.accent ? (
          <g className="text-(--icon-accent)">
            <LayerPaths layer={glyph.accent} />
          </g>
        ) : null}
      </g>
    </svg>
  )
}
