import { mkdirSync } from 'node:fs'
import { test } from '@playwright/test'

/**
 * Review screenshots — not assertions. `pnpm screens` writes every route in both
 * locales at the four review widths to .artifacts/screens/<MILESTONE>/.
 *   MILESTONE=m1 SCREEN_ROUTES=/,/styleguide pnpm screens
 */
const milestone = process.env.MILESTONE ?? 'current'
const routes = (process.env.SCREEN_ROUTES ?? '/,/styleguide')
  .split(',')
  .map((r) => r.trim())
  .filter(Boolean)
const widths = [375, 768, 1280, 1440]
const out = `.artifacts/screens/${milestone}`
mkdirSync(out, { recursive: true })

for (const locale of ['ar', 'en']) {
  for (const route of routes) {
    for (const width of widths) {
      test(`${locale} ${route} @${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(`/${locale}${route}`, { waitUntil: 'networkidle' })
        // Full-page capture stitches a sticky header mid-page; pin it, and hide the dev overlay.
        await page.addStyleTag({
          content:
            'header[data-compact], header { position: static !important } nextjs-portal { display: none !important }',
        })
        // Trigger every reveal and let fonts settle.
        await page.evaluate(async () => {
          window.scrollTo(0, document.body.scrollHeight)
          await new Promise((r) => setTimeout(r, 250))
          window.scrollTo(0, 0)
          await new Promise((r) => setTimeout(r, 300))
          await document.fonts.ready
        })
        const name = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '_')
        await page.screenshot({ path: `${out}/${name}.${locale}.${width}.png`, fullPage: true })
      })
    }
  }
}
