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
