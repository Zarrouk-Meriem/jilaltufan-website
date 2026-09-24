import { expect, test } from '@playwright/test'

/**
 * A page that fails to render shows the academy's own error page — in the visitor's
 * language, inside the site's frame, with a way to try again and a way home — never
 * Next's bare default. `/styleguide?fail=1` throws on purpose outside production.
 * (A failing root layout lands on `global-error.tsx` instead; that path was checked by
 * hand on 2026-09-24, since nothing can make the layout fail on demand without
 * shipping a switch for it.)
 */
const COPY = {
  ar: {
    title: 'تعذّر عرض هذه الصفحة',
    retry: 'أعد المحاولة',
    home: 'الصفحة الرئيسية',
    ref: 'رمز الخطأ',
  },
  en: {
    title: 'This page could not be shown',
    retry: 'Try again',
    home: 'Home',
    ref: 'Error reference',
  },
} as const

for (const locale of ['ar', 'en'] as const) {
  test(`[${locale}] a failing page shows the branded error page, with header and footer`, async ({
    page,
  }) => {
    const c = COPY[locale]
    await page.goto(`/${locale}/styleguide?fail=1`)
    const main = page.locator('main')
    const heading = main.getByRole('heading', { level: 1, name: c.title })
    await expect(heading).toBeVisible()
    await expect(heading).toBeFocused() // announced, not silent
    await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr')
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()
    await expect(main.getByRole('link', { name: c.home })).toHaveAttribute('href', `/${locale}`)
    await expect(main.getByText(new RegExp(`^${c.ref}: \\w+`))).toBeVisible()

    // Trying again re-renders the page; it still fails here, so the error page stays.
    await main.getByRole('button', { name: c.retry }).click()
    await expect(heading).toBeVisible()
  })
}

test('the same page without the switch renders normally', async ({ page }) => {
  await page.goto('/en/styleguide')
  await expect(page.getByText(COPY.en.title)).toHaveCount(0)
})
