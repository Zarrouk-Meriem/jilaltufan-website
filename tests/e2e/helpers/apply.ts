/**
 * The apply form, as a visitor drives it: the labels in both languages, the site's own
 * comboboxes, and the walk through the three steps. Shared by `apply.spec.ts`, which
 * tests the form itself, and `application-status.spec.ts`, which needs a real application
 * in the database to follow afterwards.
 */
import { expect, type Page } from '@playwright/test'

export const L = {
  ar: {
    name: 'الاسم الكامل',
    female: 'أنثى',
    dob: 'تاريخ الميلاد',
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف',
    nationality: 'الجنسية',
    country: 'بلد الإقامة',
    profession: 'المهنة',
    tunisia: 'تونس',
    code: 'رمز الدولة',
    tunisiaCode: '+216',
    day: 'اليوم',
    month: 'الشهر',
    year: 'السنة',
    may: 'مايو',
    palestine: 'فلسطين',
    friend: 'صديق أو زميل',
    no: 'لا',
    yes: 'نعم',
    orgName: 'اسم الجهة',
    hear: /كيف تعرّفت/,
    why: /لماذا تريد/,
    about: /حدّثنا عن نفسك/,
    cv: 'السيرة الذاتية',
    pledge: /أتعهد/,
    ageConfirmed: /أؤكد أن عمري 18 سنة فأكثر/,
    consent: /أوافق/,
    next: 'التالي',
    back: 'السابق',
    submit: /أرسل الطلب/,
    success: 'استلمنا طلبك',
    required: 'هذا الحقل مطلوب',
    step: (n: number) => `الخطوة ${n} من 3`,
  },
  en: {
    name: 'Full name',
    female: 'Female',
    dob: 'Date of birth',
    email: 'Email',
    phone: 'Phone number',
    nationality: 'Nationality',
    country: 'Country of residence',
    profession: 'Profession',
    tunisia: 'Tunisia',
    code: 'Country code',
    tunisiaCode: '+216',
    day: 'Day',
    month: 'Month',
    year: 'Year',
    may: 'May',
    palestine: 'Palestine',
    friend: 'A friend or colleague',
    no: 'No',
    yes: 'Yes',
    orgName: 'Name of the organisation',
    hear: /How did you hear/,
    why: /Why do you want/,
    about: /Tell us about yourself/,
    cv: 'CV',
    pledge: /I commit/,
    ageConfirmed: /I confirm that I am 18 or older/,
    consent: /I agree/,
    next: 'Next',
    back: 'Back',
    submit: /Send application/,
    success: 'We received your application',
    required: 'This field is required',
    step: (n: number) => `Step ${n} of 3`,
  },
} as const

/** The smallest PDF Payload's integrity check accepts: a header, an xref table, and %%EOF. */
export const MINIMAL_PDF = Buffer.from(
  [
    '%PDF-1.4',
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj',
    'xref',
    '0 4',
    '0000000000 65535 f ',
    '0000000009 00000 n ',
    '0000000052 00000 n ',
    '0000000101 00000 n ',
    'trailer<</Size 4/Root 1 0 R>>',
    'startxref',
    '164',
    '%%EOF',
  ].join('\n'),
)

/** Choose an option in a site combobox: type (or open) and click the matching option. */
export async function pick(page: Page, label: string | RegExp, option: string, searchable = true) {
  const input = page.getByLabel(label)
  if (searchable) await input.fill(option)
  else await input.click()
  await page.getByRole('option', { name: option, exact: true }).click()
}

/**
 * Fills step 1 and 2 and lands on step 3 with everything but the CV filled. Returns the
 * address it used, so a caller that needs to find the row afterwards can.
 */
export async function fillThroughToLastStep(
  page: Page,
  locale: 'ar' | 'en',
  email = `playwright-${Date.now()}@example.com`,
) {
  const l = L[locale]
  await page.getByLabel(l.name).fill('اختبار آلي — Playwright')
  await page.getByLabel(l.female, { exact: true }).check()
  await pick(page, l.day, '14')
  await pick(page, l.month, l.may)
  await pick(page, l.year, '2001')
  await page.getByLabel(l.email).fill(email)
  await pick(page, l.code, l.tunisiaCode)
  await page.getByLabel(l.phone).fill('20 000 000')
  await pick(page, l.nationality, l.tunisia)
  await pick(page, l.country, l.palestine)
  await page.getByLabel(l.profession).fill('Student')
  await page.getByRole('button', { name: l.next, exact: true }).click()
  await expect(page.getByText(l.step(2), { exact: true })).toBeVisible()
  await expect(page.locator('form').getByRole('alert')).toHaveCount(0)

  await page.getByLabel(l.no, { exact: true }).check()
  await page.getByRole('button', { name: l.next, exact: true }).click()
  await expect(page.getByText(l.step(3), { exact: true })).toBeVisible()
  // Arriving at a step never greets the visitor with errors for fields they have not seen.
  await expect(page.locator('form').getByRole('alert')).toHaveCount(0)

  await pick(page, l.hear, l.friend, false)
  await page
    .getByLabel(l.why)
    .fill('This is an automated end-to-end submission used to verify the application flow.')
  await page
    .getByLabel(l.about)
    .fill('An automated browser, third year, interested in checking that forms still work.')
  await page.getByLabel(l.pledge).check()
  await page.getByLabel(l.ageConfirmed).check()
  await page.getByLabel(l.consent).check()
  return email
}

/** The whole flow, through to the confirmation. Returns the address it applied with. */
export async function submitApplication(
  page: Page,
  locale: 'ar' | 'en',
  email?: string,
): Promise<string> {
  await page.goto(`/${locale}/apply`, { waitUntil: 'networkidle' })
  await expect(page.getByText(L[locale].step(1), { exact: true })).toBeVisible()
  const used = await fillThroughToLastStep(page, locale, email)
  await page
    .getByLabel(L[locale].cv)
    .setInputFiles({ name: 'cv.pdf', mimeType: 'application/pdf', buffer: MINIMAL_PDF })
  await page.getByRole('button', { name: L[locale].submit }).click()
  const status = page.getByRole('status')
  await expect(status).toBeVisible({ timeout: 20_000 })
  await expect(status).toContainText(L[locale].success)
  return used
}
