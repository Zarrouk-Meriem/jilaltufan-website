import { expect, test, type Page } from '@playwright/test'
import { skipUnlessDev } from './helpers/dev'

/**
 * Errors thrown inside a browser extension's injected script must not open the
 * Next dev overlay; errors from our own code must. Reproduces the real stack the
 * user saw (Bitdefender-adjacent extension eppiocemhmnlbhjplcgkofciiegomcon).
 */
const EXT_STACK =
  "TypeError: Cannot read properties of undefined (reading 'M_ID')\n" +
  '    at Y (chrome-extension://eppiocemhmnlbhjplcgkofciiegomcon/executors/200.js:1:761)\n' +
  '    at E (chrome-extension://eppiocemhmnlbhjplcgkofciiegomcon/executors/200.js:1:1442)'

async function overlayText(page: Page) {
  return page.evaluate(() => document.querySelector('nextjs-portal')?.shadowRoot?.textContent ?? '')
}

async function rejectWithStack(page: Page, stack: string, message: string) {
  await page.evaluate(
    ([s, m]) => {
      const err = new TypeError(m)
      err.stack = s
      void Promise.reject(err)
    },
    [stack, message] as const,
  )
  await page.waitForTimeout(700)
}

test('an unhandled rejection from an extension script does not open the dev overlay', async ({
  page,
}) => {
  await page.goto('/ar', { waitUntil: 'networkidle' })
  await skipUnlessDev(page, 'the extension filters and the overlay exist only under next dev')
  expect(
    await page.evaluate(
      () => (window as unknown as { __jaaExtErrorFilter?: boolean }).__jaaExtErrorFilter,
    ),
  ).toBe(true)
  await rejectWithStack(page, EXT_STACK, "Cannot read properties of undefined (reading 'M_ID')")
  expect(await overlayText(page)).not.toMatch(/M_ID/)
})

test('an unhandled rejection from our own code still opens the dev overlay', async ({ page }) => {
  await page.goto('/ar', { waitUntil: 'networkidle' })
  await skipUnlessDev(page, 'the overlay exists only under next dev')
  const ours =
    'TypeError: jaa-real-failure\n    at Header (http://localhost:3001/_next/static/chunks/src_components_layout.js:12:5)'
  await rejectWithStack(page, ours, 'jaa-real-failure')
  expect(await overlayText(page)).toMatch(/jaa-real-failure/)
})
