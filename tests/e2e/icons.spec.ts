import { expect, test } from '@playwright/test'

/**
 * Every icon the site renders is painted in a brand colour.
 *
 * This exists because four of them were not: they took `text-navy-800`, which is not a
 * colour the brand uses flat — it is the top stop of the navy gradient (`--navy-surface`
 * interpolates navy-800 → navy-900), and on paper it reads as a steel blue that belongs to
 * nothing. Nobody had written it down as wrong, so it spread to four call sites before it
 * was noticed by eye (2026-09-24).
 *
 * A component default would not have caught it: most icons here are affordances — chevrons,
 * arrows, a close button — that must inherit their surroundings, white on navy and ink on
 * paper. So the rule is not "one colour" but "a colour of ours", checked against what the
 * browser actually computed on the real pages.
 */

/** `tokens.css`, as the browser reports them. */
const BRAND = new Set([
  'rgb(3, 42, 63)', // --navy-900
  'rgb(5, 7, 8)', // --ink-900
  'rgb(43, 52, 57)', // --ink-700
  'rgb(95, 107, 114)', // --ink-500
  'rgb(173, 46, 57)', // --red-600
  'rgb(140, 35, 45)', // --red-700
  'rgb(140, 47, 36)', // --error-700
])

/** The top stop of the navy gradient: never a flat colour, and the reason this file exists. */
const NAVY_800 = 'rgb(0, 69, 105)'

/** White at any opacity — `--on-navy` and `--on-navy-muted`, and anything inheriting them. */
const isOnNavy = (colour: string) => /^rgba?\(255, 255, 255(,|\))/.test(colour)

/**
 * A custom property is reported as it was authored, not resolved, so white arrives as
 * `#fff`, `#ffffff` or `var(--on-navy)` depending on which rule set it.
 */
const isBrandAccent = (accent: string) => {
  const v = accent.trim().toLowerCase()
  const white = ['#fff', '#ffffff', 'white', 'var(--on-navy)', 'rgb(255, 255, 255)']
  const red = ['#ad2e39', 'var(--red-600)', 'rgb(173, 46, 57)']
  return white.includes(v) || red.includes(v)
}

const ROUTES = [
  '/',
  '/about',
  '/programs',
  '/schedule',
  '/students',
  '/knowledge/materials',
  '/contact',
  '/apply',
]

for (const locale of ['ar', 'en'] as const) {
  test(`[${locale}] every icon is painted in a brand colour`, async ({ page }) => {
    const seen = new Map<string, Set<string>>()

    for (const route of ROUTES) {
      await page.goto(`/${locale}${route}`, { waitUntil: 'domcontentloaded' })
      const icons = await page.$$eval('[data-icon]', (nodes) =>
        nodes.map((n) => {
          const style = getComputedStyle(n)
          return {
            name: n.getAttribute('data-icon') ?? '?',
            colour: style.color,
            accent: style.getPropertyValue('--icon-accent').trim(),
          }
        }),
      )
      // Every page here draws something; a page that stopped would quietly pass otherwise.
      expect(icons.length, `${route} renders no icons`).toBeGreaterThan(0)

      for (const icon of icons) {
        const where = `${route} → ${icon.name}`
        expect(
          icon.colour,
          `${where} is the navy gradient's top stop, not a flat brand colour`,
        ).not.toBe(NAVY_800)
        expect(
          BRAND.has(icon.colour) || isOnNavy(icon.colour),
          `${where} is painted ${icon.colour}, which is not one of ours`,
        ).toBe(true)

        // The accent is brand red, or folded into the body (`tone="mono"`, and white on
        // navy). A custom property comes back as authored, so `#fff` and `#ffffff` are both
        // white and neither is wrong.
        if (icon.accent && icon.accent !== 'currentColor')
          expect(
            isBrandAccent(icon.accent),
            `${where} has accent ${icon.accent}, which is neither brand red nor white on navy`,
          ).toBe(true)

        const colours = seen.get(icon.name) ?? new Set()
        colours.add(icon.colour)
        seen.set(icon.name, colours)
      }
    }

    // A sanity line in the report: what was actually checked, and in how many colours.
    expect(seen.size, 'no icons were found on any route').toBeGreaterThan(3)
  })
}
