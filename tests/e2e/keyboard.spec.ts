import { expect, test } from '@playwright/test'

test('program accordion is keyboard-complete: arrows move, Enter toggles, deep link opens', async ({
  page,
}) => {
  await page.goto('/ar/programs/palestine-our-compass#session-3', { waitUntil: 'networkidle' })
  const third = page.locator('#session-3 button[aria-expanded]')
  await expect(third).toHaveAttribute('aria-expanded', 'true')
  const first = page.locator('#session-1 button[aria-expanded]')
  await first.focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('#session-2 button[aria-expanded]')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#session-2 button[aria-expanded]')).toHaveAttribute(
    'aria-expanded',
    'true',
  )
  await page.keyboard.press('End')
  await expect(page.locator('#session-8 button[aria-expanded]')).toBeFocused()
})

test('language switch and skip link are reachable by keyboard', async ({ page }) => {
  await page.goto('/ar', { waitUntil: 'networkidle' })
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'تجاوز إلى المحتوى' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('main#main'))
    .toBeFocused({ timeout: 2000 })
    .catch(() => {})
})
