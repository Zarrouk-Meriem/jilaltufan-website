import { expect, test } from '@playwright/test'
import { fillThroughToLastStep, L, MINIMAL_PDF, pick } from './helpers/apply'

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

test('a reload keeps what was typed and the step reached; start over clears it', async ({
  page,
}) => {
  await page.goto('/en/apply', { waitUntil: 'networkidle' })
  await page.getByLabel(L.en.name).fill('Playwright Draft')
  await page.getByLabel(L.en.female, { exact: true }).check()
  await pick(page, L.en.day, '14')
  await pick(page, L.en.month, L.en.may)
  await pick(page, L.en.year, '2001')
  await page.getByLabel(L.en.email).fill('draft@example.com')
  await pick(page, L.en.code, L.en.tunisiaCode)
  await page.getByLabel(L.en.phone).fill('20 000 000')
  await pick(page, L.en.nationality, L.en.tunisia)
  await pick(page, L.en.country, L.en.palestine)
  await page.getByLabel(L.en.profession).fill('Student')
  await page.getByRole('button', { name: L.en.next, exact: true }).click()
  await expect(page.getByText(L.en.step(2), { exact: true })).toBeVisible()
  await page.waitForTimeout(500) // the draft is written 300 ms after the last change

  await page.reload({ waitUntil: 'networkidle' })
  await expect(page.getByText(L.en.step(2), { exact: true })).toBeVisible()
  await expect(page.getByText(/We restored what you typed/)).toBeVisible()
  await page.getByRole('button', { name: L.en.back, exact: true }).click()
  await expect(page.getByLabel(L.en.name)).toHaveValue('Playwright Draft')
  await expect(page.getByLabel(L.en.nationality)).toHaveValue(L.en.tunisia)
  await expect(page.getByLabel(L.en.phone)).toHaveValue('20 000 000')
  await expect(page.locator('input[name="phone"]')).toHaveValue('+21620000000')
  await expect(page.locator('input[name="dateOfBirth"]')).toHaveValue('2001-05-14')

  await page.getByRole('button', { name: 'Start over', exact: true }).click()
  await expect(page.getByLabel(L.en.name)).toHaveValue('')
  await page.reload({ waitUntil: 'networkidle' })
  await expect(page.getByText(L.en.step(1), { exact: true })).toBeVisible()
  await expect(page.getByLabel(L.en.name)).toHaveValue('')
})
