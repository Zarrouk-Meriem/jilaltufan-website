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
