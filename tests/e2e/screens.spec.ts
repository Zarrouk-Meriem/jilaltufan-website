import { mkdirSync } from 'node:fs'
import { test } from '@playwright/test'

/**
 * Review screenshots — not assertions. `pnpm screens` writes every route in both
 * locales at the four review widths to .artifacts/screens/<MILESTONE>/.
 *   MILESTONE=m1 SCREEN_ROUTES=/,/styleguide pnpm screens
 *
 * The portal lives behind a sign-in, so set an account to shoot it:
 *   MILESTONE=portal SCREEN_ACCOUNT=someone@example.com:their-password \
 *     SCREEN_ROUTES=/account,/account/sessions pnpm screens
 */
const milestone = process.env.MILESTONE ?? 'current'
const routes = (process.env.SCREEN_ROUTES ?? '/,/styleguide')
  .split(',')
  .map((r) => r.trim())
  .filter(Boolean)
const widths = [375, 768, 1280, 1440]
/** `email:password` of an account, when the routes are behind the portal's sign-in. */
const account = process.env.SCREEN_ACCOUNT
const out = `.artifacts/screens/${milestone}`
mkdirSync(out, { recursive: true })

for (const locale of ['ar', 'en']) {
  for (const route of routes) {
    for (const width of widths) {
      test(`${locale} ${route} @${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        // A portal route needs its session before the first navigation.
        if (account) {
          const [email, ...rest] = account.split(':')
          const res = await page.request.post('/api/accounts/login', {
            data: { email, password: rest.join(':') },
          })
          if (!res.ok()) throw new Error(`sign-in failed: ${res.status()} ${await res.text()}`)
        }
        await page.goto(`/${locale}${route}`, { waitUntil: 'networkidle' })
        // Full-page capture stitches a sticky header mid-page; pin it, and hide the dev overlay.
        await page.addStyleTag({
          content:
            'header[data-compact], header { position: static !important }' +
            // A full-page capture stitches anything sticky down the page; the portal's rail
            // is pinned for the same reason the site header is.
            ' [data-portal-rail] { position: static !important; height: auto !important }' +
            ' nextjs-portal { display: none !important }',
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
