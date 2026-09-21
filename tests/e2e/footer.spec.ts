import { expect, test } from '@playwright/test'

/**
 * The footer's «تابعنا» row and the Organization JSON-LD `sameAs` both come from
 * Site settings → Social links, seeded with the academy's official accounts
 * (`src/seed/data.ts`). This pins that the seeded list reaches the page in both
 * locales as labelled icon tiles, opens in a new tab safely, and reaches search engines.
 */
const official = [
  { platform: 'linkedin', url: 'https://www.linkedin.com/company/jilaltufan' },
  { platform: 'facebook', url: 'https://www.facebook.com/profile.php?id=61594463393542' },
  { platform: 'youtube', url: 'https://www.youtube.com/@jilaltufan' },
  { platform: 'instagram', url: 'https://www.instagram.com/jilaltufanacademy/' },
]
const names = {
  ar: { linkedin: 'لينكدإن', facebook: 'فيسبوك', youtube: 'يوتيوب', instagram: 'إنستغرام' },
  en: { linkedin: 'LinkedIn', facebook: 'Facebook', youtube: 'YouTube', instagram: 'Instagram' },
} as const

for (const locale of ['ar', 'en'] as const) {
  test.describe(`[${locale}] footer social links`, () => {
    test('the follow row lists the official accounts, in the guide’s order', async ({ page }) => {
      await page.goto(`/${locale}`, { waitUntil: 'networkidle' })
      const list = page.locator('footer ul[aria-labelledby="footer-follow"]')
      await expect(list).toBeVisible()
      await expect(page.locator('footer #footer-follow')).toHaveText(
        locale === 'ar' ? 'تابعنا' : 'Follow us',
      )

      const links = list.locator('a')
      await expect(links).toHaveCount(official.length)
      for (const [i, account] of official.entries()) {
        const a = links.nth(i)
        await expect(a).toHaveAttribute('href', account.url)
        await expect(a).toHaveAttribute('target', '_blank')
        await expect(a).toHaveAttribute('rel', /noopener/)
        // An icon tile: the platform name is the accessible name, the logo is decorative.
        await expect(a).toHaveAccessibleName(
          names[locale][account.platform as keyof typeof names.ar],
        )
        await expect(a.locator('svg[aria-hidden]')).toHaveCount(1)
      }

      // Hover inverts the tile (white on navy), like the on-navy button.
      await links.first().hover()
      await expect(links.first()).toHaveCSS('background-color', 'rgb(255, 255, 255)')
    })

    test('the same accounts are the organization’s sameAs', async ({ page }) => {
      await page.goto(`/${locale}`, { waitUntil: 'networkidle' })
      const blocks = await page
        .locator('script[type="application/ld+json"]')
        .evaluateAll((nodes) => nodes.map((n) => n.textContent ?? ''))
      const org = blocks
        .flatMap((raw) => {
          const parsed = JSON.parse(raw) as unknown
          return Array.isArray(parsed) ? parsed : [parsed]
        })
        .find(
          (x): x is { sameAs?: string[] } =>
            typeof x === 'object' &&
            x !== null &&
            (x as { '@type'?: string })['@type'] === 'EducationalOrganization',
        )
      expect(org?.sameAs).toEqual(official.map((o) => o.url))
    })
  })
}
