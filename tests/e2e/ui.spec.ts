import { expect, test } from '@playwright/test'

/**
 * Regressions found in the UI pass (2026-09-25), pinned so they stay fixed.
 */

test('rich-text paragraphs are spaced, inside Payload’s own wrapper', async ({ page }) => {
  // Payload wraps rich text in `div.payload-richtext`; the spacing rule once reached only
  // direct children, so every paragraph on the site ran into the next.
  await page.goto('/ar/programs/palestine-our-compass')
  const second = page.locator('.prose-jaa .payload-richtext > p').nth(1)
  await expect(second).toBeVisible()
  const gap = await second.evaluate((el) => parseFloat(getComputedStyle(el).marginBlockStart))
  expect(gap).toBeGreaterThan(8)
})

test('on a phone the hero copy sits on a navy scrim; on a wide frame it does not need one', async ({
  page,
}) => {
  // White text over the dome's highlights measured 1.19:1 on a phone before the scrim.
  const scrim = page.locator('section').first().locator('div[aria-hidden].bg-linear-to-t')
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/ar')
  await expect(scrim).toBeVisible()
  await page.setViewportSize({ width: 1280, height: 900 })
  await expect(scrim).toBeHidden()
})

// A scrolling row inside a grid stretched the whole home page to 876 px on a phone
// (the Directed Training carousel, 2026-09-26): grid items grow to their content unless told not to.
test('no page scrolls sideways on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  for (const path of ['/ar', '/en', '/ar/programs', '/en/programs']) {
    await page.goto(path, { waitUntil: 'networkidle' })
    const [sw, cw] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      document.documentElement.clientWidth,
    ])
    expect(sw, path).toBeLessThanOrEqual(cw)
  }
})

test('the Directed Training carousel moves one card forward, in either direction of writing', async ({
  page,
}) => {
  for (const [locale, name, next, prev] of [
    ['ar', 'التدريب الموجّه', 'التالي', 'السابق'],
    ['en', 'Directed Training', 'Next', 'Previous'],
  ] as const) {
    await page.goto(`/${locale}`, { waitUntil: 'networkidle' })
    const region = page.getByRole('region', { name })
    const track = region.locator('ul')
    await expect(region.getByRole('button', { name: prev })).toBeDisabled()
    await region.getByRole('button', { name: next }).click()
    await expect
      .poll(() => track.evaluate((el) => Math.abs(el.scrollLeft)), { message: locale })
      .toBeGreaterThan(100)
    await expect(region.getByRole('button', { name: prev })).toBeEnabled()
  }
})
