import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const locales = [
  { code: 'ar', dir: 'rtl' },
  { code: 'en', dir: 'ltr' },
] as const

// Grows with every milestone. M1: the shell, the styleguide, and the 404.
const routes = [
  '/',
  '/about',
  '/about/structure',
  '/programs',
  '/programs/palestine-our-compass',
  '/styleguide',
  '/this-page-does-not-exist',
]

for (const { code, dir } of locales) {
  test.describe(`[${code}]`, () => {
    for (const route of routes) {
      test(`${route} renders with lang/dir and no serious axe violations`, async ({ page }) => {
        const res = await page.goto(`/${code}${route}`)
        const is404 = route.includes('does-not-exist')
        expect(res?.status()).toBe(is404 ? 404 : 200)
        await expect(page.locator('html')).toHaveAttribute('lang', code)
        await expect(page.locator('html')).toHaveAttribute('dir', dir)
        await expect(page.locator('main#main')).toBeVisible()
        await expect(page.getByRole('banner')).toBeVisible()
        await expect(page.getByRole('contentinfo')).toBeVisible()

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
          .analyze()
        const serious = results.violations.filter(
          (v) => v.impact === 'serious' || v.impact === 'critical',
        )
        expect(
          serious,
          JSON.stringify(
            serious.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
            null,
            2,
          ),
        ).toEqual([])
      })
    }
  })
}

test('root redirects by Accept-Language and defaults to Arabic', async ({ browser }) => {
  // Chromium merges its own Accept-Language with extra headers; `locale` is the reliable knob.
  for (const [locale, expected] of [
    ['en-US', /\/en$/],
    ['fr-FR', /\/ar$/],
    ['ar-PS', /\/ar$/],
  ] as const) {
    const context = await browser.newContext({ locale })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page).toHaveURL(expected)
    await context.close()
  }
})

test('language switch keeps the visitor on the equivalent page', async ({ page }) => {
  await page.goto('/ar/styleguide')
  await page
    .getByRole('contentinfo')
    .getByRole('link', { name: /English/ })
    .click()
  await expect(page).toHaveURL(/\/en\/styleguide$/)
  await page
    .getByRole('contentinfo')
    .getByRole('link', { name: /العربية/ })
    .click()
  await expect(page).toHaveURL(/\/ar\/styleguide$/)
})

test('mobile menu is keyboard operable', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/ar')
  const open = page.getByRole('banner').getByRole('button', { name: /القائمة/ })
  await open.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('Payload admin is not swallowed by the locale proxy', async ({ page }) => {
  const res = await page.goto('/admin')
  expect(res?.url()).toMatch(/\/admin/)
  expect(res?.url()).not.toMatch(/\/(ar|en)\/admin/)
})
