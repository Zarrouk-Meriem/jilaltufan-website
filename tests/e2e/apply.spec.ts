import { expect, test, type Page } from '@playwright/test'

const L = {
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
const MINIMAL_PDF = Buffer.from(
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
async function pick(page: Page, label: string | RegExp, option: string, searchable = true) {
  const input = page.getByLabel(label)
  if (searchable) await input.fill(option)
  else await input.click()
  await page.getByRole('option', { name: option, exact: true }).click()
}

/** Fills step 1 and 2 and lands on step 3 with everything but the CV filled. */
async function fillThroughToLastStep(page: Page, locale: 'ar' | 'en') {
  const l = L[locale]
  await page.getByLabel(l.name).fill('اختبار آلي — Playwright')
  await page.getByLabel(l.female, { exact: true }).check()
  await pick(page, l.day, '14')
  await pick(page, l.month, l.may)
  await pick(page, l.year, '2001')
  await page.getByLabel(l.email).fill(`playwright-${Date.now()}@example.com`)
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
  await page.getByLabel(l.consent).check()
}

for (const locale of ['ar', 'en'] as const) {
  test(`[${locale}] apply happy path walks the three steps and shows the confirmation`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/apply`, { waitUntil: 'networkidle' })
    await expect(page.getByText(L[locale].step(1), { exact: true })).toBeVisible()
    await fillThroughToLastStep(page, locale)
    await page.getByLabel(L[locale].cv).setInputFiles({
      name: 'cv.pdf',
      mimeType: 'application/pdf',
      buffer: MINIMAL_PDF,
    })
    await page.getByRole('button', { name: L[locale].submit }).click()
    const status = page.getByRole('status')
    await expect(status).toBeVisible({ timeout: 20_000 })
    await expect(status).toContainText(L[locale].success)
  })
}

test('a step does not advance until its own fields are valid, in the visitor language', async ({
  page,
}) => {
  await page.goto('/ar/apply', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: L.ar.next, exact: true }).click()
  await expect(page.locator('form').getByRole('alert').first()).toContainText(L.ar.required)
  await expect(page.getByText(L.ar.step(1), { exact: true })).toBeVisible()
  await expect(page.getByRole('status')).toHaveCount(0)
})

test('the organisation name is asked only after answering yes, and back keeps what was typed', async ({
  page,
}) => {
  await page.goto('/en/apply', { waitUntil: 'networkidle' })
  await page.getByLabel(L.en.name).fill('Playwright')
  await page.getByLabel(L.en.female, { exact: true }).check()
  await pick(page, L.en.day, '14')
  await pick(page, L.en.month, L.en.may)
  await pick(page, L.en.year, '2001')
  await page.getByLabel(L.en.email).fill('playwright@example.com')
  await pick(page, L.en.code, L.en.tunisiaCode)
  await page.getByLabel(L.en.phone).fill('20 000 000')
  await pick(page, L.en.nationality, L.en.tunisia)
  await pick(page, L.en.country, L.en.palestine)
  await page.getByLabel(L.en.profession).fill('Student')
  await page.getByRole('button', { name: L.en.next, exact: true }).click()
  await expect(page.getByText(L.en.step(2), { exact: true })).toBeVisible()

  // Mounted but collapsed until the answer is yes; it eases open rather than popping in.
  // (Clipped by the collapsed wrapper, so it intersects nothing; a hidden check would pass
  // on a merely off-screen element too.)
  await expect(page.getByLabel(L.en.orgName)).not.toBeInViewport()
  await page.getByLabel(L.en.yes, { exact: true }).check()
  await expect(page.getByLabel(L.en.orgName)).toBeInViewport()
  await expect(page.getByLabel(L.en.orgName)).toBeVisible()
  await page.getByRole('button', { name: L.en.next, exact: true }).click()
  await expect(page.locator('form').getByRole('alert').first()).toContainText(L.en.required)

  await page.getByRole('button', { name: L.en.back, exact: true }).click()
  await expect(page.getByText(L.en.step(1), { exact: true })).toBeVisible()
  await expect(page.getByLabel(L.en.name)).toHaveValue('Playwright')
})

test('a filled honeypot is silently accepted (bots learn nothing) but not surfaced as an error', async ({
  page,
}) => {
  await page.goto('/en/apply', { waitUntil: 'networkidle' })
  await fillThroughToLastStep(page, 'en')
  await page.locator('#website').fill('http://spam.example', { force: true })
  await page.getByRole('button', { name: L.en.submit }).click()
  await expect(page.getByRole('status')).toBeVisible({ timeout: 20_000 })
})

test('the country combobox filters as you type and picks with the keyboard', async ({ page }) => {
  await page.goto('/ar/apply', { waitUntil: 'networkidle' })
  const input = page.getByLabel(L.ar.nationality)
  await input.fill('تون')
  await expect(page.getByRole('option').first()).toHaveText(L.ar.tunisia)
  // Typing already highlights the first match; ArrowDown would move to the second.
  await input.press('Enter')
  await expect(input).toHaveValue(L.ar.tunisia)
  await expect(page.getByRole('listbox')).toBeHidden()
  // The value the server reads travels in the hidden input, as the ISO code.
  await expect(page.locator('input[name="nationality"]')).toHaveValue('TN')
})
