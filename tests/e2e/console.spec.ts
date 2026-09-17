import { expect, test, type Page } from '@playwright/test'

/**
 * Zero console errors AND warnings on every route in a clean browser, and after a
 * client-side navigation (React warns about some things only on client re-render).
 * A route that legitimately 404s may log its own failed resource load, nothing else.
 */
const routes = [
  '/',
  '/about',
  '/about/structure',
  '/programs',
  '/programs/palestine-our-compass',
  '/schedule',
  '/events',
  '/events/jeel-altoufan-camp',
  '/projects',
  '/apply',
  '/students',
  '/instructors',
  '/knowledge',
  '/knowledge/minbar',
  '/knowledge/materials',
  '/contact',
  '/privacy',
  '/terms',
  '/styleguide',
  '/this-page-does-not-exist',
]

const ALLOWED = [/Failed to load resource: the server responded with a status of 404/]

function collect(page: Page) {
  const msgs: string[] = []
  page.on('console', (m) => {
    if (m.type() !== 'error' && m.type() !== 'warning') return
    const text = m.text()
    if (ALLOWED.some((re) => re.test(text))) return
    msgs.push(`${m.type()}: ${text.split('\n')[0]}`)
  })
  page.on('pageerror', (e) => msgs.push(`pageerror: ${e.message.split('\n')[0]}`))
  return msgs
}

for (const locale of ['ar', 'en']) {
  for (const route of routes) {
    test(`[${locale}] ${route} — no console errors or warnings`, async ({ page }) => {
      const msgs = collect(page)
      await page.goto(`/${locale}${route}`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(600)
      expect(msgs).toEqual([])
    })
  }
}

test('client-side navigation home → programs → program → home stays clean', async ({ page }) => {
  const msgs = collect(page)
  await page.goto('/ar', { waitUntil: 'networkidle' })
  await page
    .getByRole('navigation', { name: 'التنقل الرئيسي' })
    .getByRole('link', { name: 'البرامج' })
    .click()
  await expect(page).toHaveURL(/\/ar\/programs$/)
  await page
    .getByRole('link', { name: /فلسطين بوصلتنا/ })
    .first()
    .click()
  await expect(page).toHaveURL(/\/ar\/programs\/palestine-our-compass$/)
  await page
    .getByRole('banner')
    .getByRole('link', { name: /الصفحة الرئيسية/ })
    .click()
  await expect(page).toHaveURL(/\/ar$/)
  await page.waitForTimeout(600)
  expect(msgs).toEqual([])
})
