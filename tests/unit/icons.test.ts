import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ICONS, Icon, type IconName } from '@/components/icons/Icon'

const NAMES = Object.keys(ICONS) as IconName[]
const render = (props: Parameters<typeof Icon>[0]) =>
  renderToStaticMarkup(createElement(Icon, props))

/** Path data with numbers stripped, so a stray `undefined` or `NaN` shows up as text. */
const pathData = (svg: string) => [...svg.matchAll(/ d="([^"]*)"/g)].map((m) => m[1]!)

describe('icon set', () => {
  it('renders every glyph as valid path data inside the 24-unit grid', () => {
    for (const name of NAMES) {
      const svg = render({ name })
      expect(svg, name).toContain('viewBox="0 0 24 24"')
      const ds = pathData(svg)
      expect(ds.length, name).toBeGreaterThan(0)
      for (const d of ds) {
        expect(d, `${name}: ${d}`).toMatch(/^[MmLlHhVvAaCcZz0-9 .-]+$/)
        for (const n of d.match(/-?\d+(\.\d+)?/g) ?? []) {
          const v = Number(n)
          expect(v, `${name}: ${d}`).toBeGreaterThanOrEqual(-24)
          expect(v, `${name}: ${d}`).toBeLessThanOrEqual(24)
        }
      }
    }
  })

  it('is sharp: no rounded joins, caps, or corners anywhere', () => {
    for (const name of NAMES) {
      const svg = render({ name })
      expect(svg, name).toContain('stroke-linejoin="miter"')
      expect(svg, name).toContain('stroke-linecap="butt"')
      expect(svg, name).not.toMatch(/\srx=|\sry=|round/)
    }
  })

  it('paints the accent through the token and folds it into the body for mono', () => {
    const duo = render({ name: 'calendar' })
    expect(duo).toContain('class="text-(--icon-accent)"')
    expect(duo).not.toContain('icon-mono')
    expect(duo).not.toMatch(/#[0-9a-f]{3,6}/i)
    const mono = render({ name: 'calendar', tone: 'mono' })
    expect(mono).toContain('icon-mono')
  })

  it('has an accent on every content icon and none on the bare interface glyphs', () => {
    const bare: IconName[] = ['chevron', 'close', 'menu', 'check', 'plus', 'minus']
    for (const name of NAMES) {
      const has = render({ name }).includes('text-(--icon-accent)')
      expect(has, name).toBe(!bare.includes(name))
    }
  })

  it('mirrors directional icons in RTL and leaves the rest alone', () => {
    expect(render({ name: 'arrow' })).toContain('rtl:-scale-x-100')
    expect(render({ name: 'arrow', direction: 'back' })).toContain('-scale-x-100 rtl:scale-x-100')
    expect(render({ name: 'arrow', direction: 'up' })).toContain('-rotate-90')
    expect(render({ name: 'chevron' })).not.toMatch(/rotate|scale/)
    expect(render({ name: 'chevron', direction: 'up' })).toContain('rotate-180')
    expect(render({ name: 'chevron', direction: 'forward' })).toContain('-rotate-90 rtl:rotate-90')
    expect(render({ name: 'chevron', direction: 'back' })).toContain('rotate-90 rtl:-rotate-90')
    for (const name of ['arrow-diagonal', 'external', 'quote'] as IconName[]) {
      expect(render({ name }), name).toContain('rtl:-scale-x-100')
    }
    for (const name of ['play', 'download', 'globe', 'file', 'book', 'calendar'] as IconName[]) {
      expect(render({ name }), name).not.toMatch(/scale-x|rotate/)
    }
  })

  it('is decorative by default and accepts overrides', () => {
    expect(render({ name: 'lock' })).toContain('aria-hidden="true"')
    expect(render({ name: 'lock', className: 'size-4 text-navy-800' })).toContain(
      'shrink-0 size-4 text-navy-800',
    )
  })
})
