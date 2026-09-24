import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { Prose } from '@/components/content/Prose'

/**
 * Saving a rich-text field through the admin stamps `format: 'start'` on every block, and
 * Payload's converter maps that logical value to the physical `text-align: left` — which
 * pushed Arabic prose to the wrong edge once an editor had touched it (2026-09-24,
 * `/ar/programs/open-training`). `Prose` overrides it back to the logical keyword.
 */
const paragraph = (format: string, text = 'مسار مفتوح لشباب الأمة') => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: null,
    children: [
      {
        type: 'paragraph',
        format,
        indent: 0,
        version: 1,
        direction: null,
        children: [
          { type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 },
        ],
      },
    ],
  },
})

const render = (format: string) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderToStaticMarkup(createElement(Prose, { data: paragraph(format) as any }))

describe('Prose alignment', () => {
  it('keeps `start` logical, so Arabic does not flip to the left edge', () => {
    const html = render('start')
    expect(html).toContain('text-align:start')
    expect(html).not.toContain('text-align:left')
  })

  it('keeps `end` logical too', () => {
    const html = render('end')
    expect(html).toContain('text-align:end')
    expect(html).not.toContain('text-align:right')
  })

  it('leaves a block with no alignment unstyled', () => {
    expect(render('')).not.toContain('text-align')
  })

  it('leaves centre alone — it means the same in both directions', () => {
    expect(render('center')).toContain('text-align:center')
  })

  it('leaves a deliberate physical choice alone', () => {
    expect(render('right')).toContain('text-align:right')
  })
})
