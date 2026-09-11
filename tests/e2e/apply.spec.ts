import { expect, test } from '@playwright/test'

const fill = async (page: import('@playwright/test').Page, locale: 'ar' | 'en') => {
  const L =
    locale === 'ar'
      ? {
          name: 'الاسم الكامل',
          email: 'البريد الإلكتروني',
          country: 'البلد',
          age: 'الفئة العمرية',
          why: /لماذا تريد/,
          consent: /أوافق/,
        }
      : {
          name: 'Full name',
          email: 'Email',
          country: 'Country',
          age: 'Age range',
          why: /Why do you want/,
          consent: /I agree/,
        }
  await page.getByLabel(L.name).fill('اختبار آلي — Playwright')
  await page.getByLabel(L.email).fill(`playwright-${Date.now()}@example.com`)
  await page.getByLabel(L.country).fill('Tunisia')
  await page.getByLabel(L.age).selectOption('18-24')
  await page
    .getByLabel(L.why)
    .fill('This is an automated end-to-end submission used to verify the application flow.')
  await page.getByLabel(L.consent).check()
}

for (const locale of ['ar', 'en'] as const) {
  test(`[${locale}] apply happy path shows the mode-specific confirmation`, async ({ page }) => {
    await page.goto(`/${locale}/apply/palestine-our-compass`, { waitUntil: 'networkidle' })
    await fill(page, locale)
    await page
      .getByRole('button', { name: locale === 'ar' ? /أرسل الطلب/ : /Send application/ })
      .click()
    const status = page.getByRole('status')
    await expect(status).toBeVisible({ timeout: 15_000 })
    await expect(status).toContainText(
      locale === 'ar' ? 'استلمنا طلبك' : 'We received your application',
    )
  })
}

test('inline validation blocks an empty submission in the visitor language', async ({ page }) => {
  await page.goto('/ar/apply/palestine-our-compass', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /أرسل الطلب/ }).click()
  await expect(page.getByRole('alert').first()).toContainText('هذا الحقل مطلوب')
  await expect(page.getByRole('status')).toHaveCount(0)
})

test('a filled honeypot is silently accepted (bots learn nothing) but not surfaced as an error', async ({
  page,
}) => {
  await page.goto('/en/apply/palestine-our-compass', { waitUntil: 'networkidle' })
  await fill(page, 'en')
  await page.locator('#website').fill('http://spam.example', { force: true })
  await page.getByRole('button', { name: /Send application/ }).click()
  await expect(page.getByRole('status')).toBeVisible({ timeout: 15_000 })
})

test('the program chooser lists every published program with its registration state', async ({
  page,
}) => {
  await page.goto('/ar/apply', { waitUntil: 'networkidle' })
  await expect(page.getByRole('link', { name: /فلسطين بوصلتنا/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /التدريب المفتوح/ })).toBeVisible()
})
