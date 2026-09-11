import { expect, test, type BrowserContext } from '@playwright/test'
import { skipUnlessDev } from './helpers/dev'

const routes = [
  '/ar',
  '/en',
  '/ar/about',
  '/ar/programs',
  '/ar/programs/palestine-our-compass',
  '/en/styleguide',
]

/** Stamp an attribute on every div before React hydrates, the way DOM-touching extensions do. */
async function simulateExtension(context: BrowserContext, attr: string) {
  await context.addInitScript((a: string) => {
    const stamp = (n: Node) => {
      const el = n as Element
      if (el.nodeType === 1 && el.tagName === 'DIV' && !el.hasAttribute(a)) {
        el.setAttribute(a, '1')
        if (a === 'bis_skin_checked') {
          // Bitdefender writes the whole family, not just the flag.
          el.setAttribute(
            'bis_size',
            JSON.stringify({ x: 0, y: 0, w: 10, h: 10, abs_x: 0, abs_y: 0 }),
          )
          el.setAttribute('bis_id', 'b' + Math.random().toString(36).slice(2, 10))
          el.setAttribute('__processed_1a2b3c__', 'true')
        }
      }
    }
    const sweep = (r: Node) => (r as Element).querySelectorAll?.('div').forEach(stamp)
    new MutationObserver((ms) => {
      for (const m of ms)
        for (const n of m.addedNodes) {
          stamp(n)
          sweep(n)
        }
    }).observe(document, { childList: true, subtree: true })
    document.addEventListener('DOMContentLoaded', () => sweep(document))
  }, attr)
}

function collectHydrationErrors(page: import('@playwright/test').Page) {
  const errs: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error' && /hydrat/i.test(m.text())) errs.push(m.text().split('\n')[0]!)
  })
  return errs
}

test.describe('hydration', () => {
  for (const route of routes) {
    test(`${route} hydrates with zero errors in a clean browser`, async ({ page }) => {
      const errs = collectHydrationErrors(page)
      await page.goto(route, { waitUntil: 'networkidle' })
      await page.waitForTimeout(800)
      expect(errs).toEqual([])
    })
  }

  test('extension noise (bis_skin_checked) does not surface as a hydration error', async ({
    browser,
  }) => {
    const context = await browser.newContext()
    await simulateExtension(context, 'bis_skin_checked')
    const page = await context.newPage()
    const errs = collectHydrationErrors(page)
    await page.goto('/ar', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    expect(await page.locator('div[bis_skin_checked]').count()).toBeGreaterThan(10)
    expect(errs).toEqual([])
    await context.close()
  })

  test('a real DOM mismatch still surfaces (the filter is not a blanket suppression)', async ({
    browser,
  }) => {
    const context = await browser.newContext()
    await simulateExtension(context, 'data-foreign-mutation')
    const page = await context.newPage()
    const errs = collectHydrationErrors(page)
    await page.goto('/ar', { waitUntil: 'networkidle' })
    // Production React reports mismatches through onRecoverableError, not console.error,
    // and the filter under test is dev-only anyway.
    await skipUnlessDev(page, 'checks that the dev-only filter is not a blanket suppression')
    await page.waitForTimeout(800)
    expect(errs.length).toBeGreaterThan(0)
    await context.close()
  })
})
