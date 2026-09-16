import { expect, test } from '@playwright/test'

/**
 * Regression guard for a reported "glitch" in the scroll-shrink header: the logo used to
 * swap between two differently-sized <Image> instances via a discrete display:none/flex
 * toggle, while the header's own height animated over 200ms — so the logo popped to its
 * final size a frame before the bar around it finished easing down. The fix keeps one
 * logo and scales it with the CSS `scale` property (Tailwind's `scale-*` sets `scale`, not
 * `transform`) on the same transition, so both must always be mid-animation (or finished)
 * together, never "logo already small, bar still tall".
 */
test.describe('header shrink-on-scroll', () => {
  test('the logo scales in step with the bar — never small logo in a still-tall bar', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/ar', { waitUntil: 'networkidle' })

    const header = page.locator('header')
    // The bar is the first child; the <header> itself keeps a constant height (see below).
    const bar = header.locator('> div').first()
    const logoWrap = header.locator('a > span').first()

    expect(await header.getAttribute('data-compact')).toBeNull()

    await page.mouse.wheel(0, 300)

    // Sample repeatedly through the 200ms transition window; whenever the bar has
    // already reached its compact height, the logo must already be at its compact
    // scale too (both driven by the same 200ms transition on the same trigger).
    const samples: { headerH: number; scale: string }[] = []
    for (let i = 0; i < 12; i++) {
      const headerH = await bar.evaluate((el) => el.getBoundingClientRect().height)
      const scale = await logoWrap.evaluate((el) => getComputedStyle(el).scale)
      samples.push({ headerH, scale })
      await page.waitForTimeout(20)
    }

    const compactHeight = samples[samples.length - 1]!.headerH
    const compactScale = samples[samples.length - 1]!.scale
    expect(compactHeight).toBeLessThan(80)
    expect(compactScale).not.toBe('none')
    expect(Number(compactScale)).toBeLessThan(1)

    const strandedFrame = samples.find((s) => s.headerH === compactHeight && s.scale === 'none')
    expect(
      strandedFrame,
      'found a frame with the compact bar height but an unscaled logo',
    ).toBeUndefined()
  })

  test('below md, the logo never scales down (mobile keeps one size)', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 900 })
    await page.goto('/ar', { waitUntil: 'networkidle' })
    const logoWrap = page.locator('header a > span').first()
    await page.mouse.wheel(0, 300)
    await page.waitForTimeout(300)
    expect(await logoWrap.evaluate((el) => getComputedStyle(el).scale)).toBe('none')
  })
})

/**
 * Regression guard for the second reported "glitch": a shudder the moment scrolling
 * started. The <header> used to shrink in flow (96px → 64px), which moved everything
 * below it up by 32px; Chrome's scroll anchoring then scrolled back to keep the hero
 * where it was, scrollY fell under the 24px threshold, the header grew again, and the
 * two fought for a dozen frames. Now only the bar inside shrinks: the <header>'s own
 * height is constant, so nothing below it moves and scrollY is never touched.
 */
test.describe('header shrink never fights scroll anchoring', () => {
  for (const [name, width] of [
    ['desktop', 1280],
    ['phone', 375],
  ] as const) {
    test(`${name}: scrollY stays put and the page never shifts through the threshold`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/ar', { waitUntil: 'networkidle' })

      const samples = await page.evaluate(async () => {
        const header = document.querySelector('header')!
        const bar = header.firstElementChild!
        const main = document.querySelector('main')!
        const raf = () => new Promise((r) => requestAnimationFrame(r))
        const out: {
          target: number
          scrollY: number
          headerH: number
          barH: number
          mainTop: number
          compact: boolean
        }[] = []
        // Step through the threshold slowly and let each step settle for a few frames —
        // the oscillation showed up within four frames of crossing 24px.
        for (let y = 0; y <= 80; y += 2) {
          window.scrollTo(0, y)
          for (let f = 0; f < 4; f++) {
            await raf()
            out.push({
              target: y,
              scrollY: window.scrollY,
              headerH: header.getBoundingClientRect().height,
              barH: bar.getBoundingClientRect().height,
              mainTop: main.getBoundingClientRect().top,
              compact: header.hasAttribute('data-compact'),
            })
          }
        }
        return out
      })

      const headerH = samples[0]!.headerH
      let sawCompact = false
      for (const s of samples) {
        // The browser never moved the scroll position on its own.
        expect(s.scrollY, `scrollY drifted at target ${s.target}`).toBe(s.target)
        // The header's in-flow height is constant; the page below it only moves with scroll.
        expect(s.headerH).toBe(headerH)
        expect(s.mainTop + s.scrollY, `content shifted at target ${s.target}`).toBe(headerH)
        // Compact never flips back once set (React commits it a frame after the scroll
        // event, so the check is "monotonic", not "instant"), and never fires early.
        if (s.compact) sawCompact = true
        expect(s.compact, `compact flipped back at target ${s.target}`).toBe(sawCompact)
        if (s.target <= 24) expect(s.compact).toBe(false)
      }
      expect(sawCompact).toBe(true)
      // …and the bar really did shrink.
      expect(samples[samples.length - 1]!.barH).toBeLessThan(headerH)
    })
  }
})

/**
 * Regression guard: the header CTA used to carry `hidden sm:inline-flex` on top of the
 * button's own `inline-flex`. Tailwind v4 emits `inline-flex` after `hidden`, so the CTA
 * never hid on phones; with the wide English wordmark the row overflowed and the menu
 * button sat off-screen at x≈379 on a 375px viewport. `max-sm:hidden` is a variant and
 * always sorts after the base utility.
 */
test.describe('header on a 375px phone', () => {
  for (const locale of ['ar', 'en']) {
    test(`${locale}: no horizontal overflow, menu button on-screen, CTA hidden`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 800 })
      await page.goto(`/${locale}/students`, { waitUntil: 'networkidle' })
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(scrollWidth).toBeLessThanOrEqual(375)
      const menu = page.locator('header button[aria-controls="mobile-menu"]')
      await expect(menu).toBeVisible()
      const box = (await menu.boundingBox())!
      expect(box.x + box.width).toBeLessThanOrEqual(375)
      await expect(page.locator('header > div:first-child a[href*="apply"]')).toBeHidden()
    })
  }
})
