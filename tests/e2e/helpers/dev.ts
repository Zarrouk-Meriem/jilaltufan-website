import { test, type Page } from '@playwright/test'

/**
 * Next renders <nextjs-portal> (the dev tools and error overlay) on every page
 * under `next dev` and never in production. Some guards only make sense with
 * the overlay present — the extension filters are dev-only by design.
 */
export async function isDevServer(page: Page): Promise<boolean> {
  return (await page.locator('nextjs-portal').count()) > 0
}

export async function skipUnlessDev(page: Page, why: string) {
  test.skip(!(await isDevServer(page)), `dev-only: ${why}`)
}

/**
 * Wait until the page has been animation-free for two consecutive checks
 * (page-enter, reveals, accordion panels; streamed content can start new ones
 * after the first batch settles). Infinite animations (the loader, the live dot)
 * are ignored. Axe blends an animating ancestor's opacity into computed colours,
 * so an audit that runs mid-fade reports contrast failures the settled page does
 * not have.
 */
export async function settleAnimations(page: Page) {
  const finite = () =>
    page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => a.effect?.getTiming().iterations !== Infinity)
          .map((a) => a.finished.catch(() => undefined)),
      ).then((list) => list.length),
    )
  let quiet = 0
  for (let i = 0; i < 40 && quiet < 2; i++) {
    quiet = (await finite()) === 0 ? quiet + 1 : 0
    await page.waitForTimeout(100)
  }
}
