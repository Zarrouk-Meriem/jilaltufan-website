import { expect, test } from '@playwright/test'

test('contact form happy path (ar) shows the confirmation', async ({ page }) => {
  await page.goto('/ar/contact', { waitUntil: 'networkidle' })
  await page.getByLabel('الاسم').fill('اختبار آلي')
  await page.getByLabel('البريد الإلكتروني').fill(`contact-${Date.now()}@example.com`)
  await page.getByLabel('الموضوع').fill('سؤال عن المواعيد')
  await page.getByLabel('الرسالة').fill('هل تُعلن مواعيد الحصص قبل بداية الموسم؟ شكرًا لكم.')
  await page.getByRole('button', { name: /أرسل الرسالة/ }).click()
  await expect(page.getByRole('status')).toContainText('وصلتنا رسالتك', { timeout: 15_000 })
})

test('contact form validates inline (en)', async ({ page }) => {
  await page.goto('/en/contact', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Send message/ }).click()
  await expect(page.getByRole('alert').first()).toContainText('This field is required')
  await expect(page.getByRole('status')).toHaveCount(0)
})
