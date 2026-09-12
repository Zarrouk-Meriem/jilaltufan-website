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
    const logoWrap = header.locator('a > span').first()

    expect(await header.getAttribute('data-compact')).toBeNull()

    await page.mouse.wheel(0, 300)

    // Sample repeatedly through the 200ms transition window; whenever the bar has
    // already reached its compact height, the logo must already be at its compact
    // scale too (both driven by the same 200ms transition on the same trigger).
    const samples: { headerH: number; scale: string }[] = []
    for (let i = 0; i < 12; i++) {
      const headerH = await header.evaluate((el) => el.getBoundingClientRect().height)
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
