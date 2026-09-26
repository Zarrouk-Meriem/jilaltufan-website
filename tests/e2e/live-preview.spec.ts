import { expect, test } from '@playwright/test'
import { staffConfigured, staffCredentials } from './helpers/staff'

/**
 * The admin's live-preview pane follows the typing (user report, 2026-09-26: «no real-time
 * change»), and the home sections are editable. The page globals autosave drafts; the pane
 * loads `/preview`, which puts a staff browser in draft mode; each autosave refreshes it.
 * Visitors keep the published page until «Publish changes».
 *
 * Needs the throwaway staff accounts from `scripts/e2e-staff.ts`; skips without them.
 */
const editor = staffCredentials('EDITOR_B')

test.skip(!staffConfigured('EDITOR_B'), 'pnpm payload:tsx run scripts/e2e-staff.ts')
// One worker, in order: both tests sign the same account in.
test.describe.configure({ mode: 'default' })

test('/preview is for staff only and never leaves the site', async ({ page, browser }) => {
  const visitor = await browser.newPage()
  const anonymous = await visitor.goto('/preview?path=/ar')
  expect(anonymous?.status()).toBe(403)
  await visitor.close()

  expect((await page.request.post('/api/users/login', { data: editor })).status()).toBe(200)
  for (const bad of ['//evil.example', 'https://evil.example', '/fr', '/ar\\evil'])
    expect((await page.goto(`/preview?path=${encodeURIComponent(bad)}`))?.status(), bad).toBe(400)
  await page.goto('/preview?path=/ar')
  await expect(page).toHaveURL(/\/ar$/)
  const cookies = await page.context().cookies()
  expect(cookies.some((c) => c.name === '__prerender_bypass')).toBe(true)
  // Outside the admin's pane, the browser says it is seeing drafts and offers the way out.
  await expect(page.getByText('وضع المعاينة')).toBeVisible()
})

test('typing a section title shows in the preview at once; visitors see it only once published', async ({
  page,
  browser,
}) => {
  test.setTimeout(90_000)
  const stamp = `لماذا نحن ${Date.now()}`
  expect((await page.request.post('/api/users/login', { data: editor })).status()).toBe(200)
  await page.goto('/admin/globals/home-page?locale=ar')

  // The pane: open it if the editor's preference left it closed.
  await page.setViewportSize({ width: 1600, height: 1000 })
  const frame = page.frameLocator('iframe').first()
  await page.getByRole('button', { name: 'Publish changes' }).waitFor()
  // The pane's device switcher is there exactly when the pane is open; the iframe alone is
  // mounted before it shows, so testing that toggled an opening pane shut.
  const toolbar = page.getByText('Responsive', { exact: true }).first()
  await toolbar.waitFor({ timeout: 3_000 }).catch(() => {})
  if (!(await toolbar.isVisible())) await page.getByRole('button', { name: 'Live Preview' }).click()
  await expect(toolbar).toBeVisible()
  await expect(frame.locator('main')).toBeVisible({ timeout: 20_000 })

  await page.getByRole('button', { name: 'Sections', exact: true }).click()
  // Each section is a folded panel whose header holds a «Toggle block» button.
  await page.getByRole('button', { name: 'Toggle block' }).first().click()
  const title = page.locator('#field-missionTitle')
  const original = await title.inputValue()
  await title.fill(stamp)

  // No save pressed: the autosaved draft reaches the pane.
  await expect(frame.getByRole('heading', { name: stamp })).toBeVisible({ timeout: 20_000 })

  // A visitor still reads the published page.
  const visitor = await browser.newPage()
  await visitor.goto('/ar')
  await expect(visitor.getByRole('heading', { name: stamp })).toHaveCount(0)

  // Published: now everyone sees it.
  await page.getByRole('button', { name: 'Publish changes' }).click()
  await expect(page.getByText(/updated successfully|published successfully/i).first()).toBeVisible({
    timeout: 15_000,
  })
  await visitor.goto('/ar')
  await expect(visitor.getByRole('heading', { name: stamp })).toBeVisible()
  await visitor.close()

  // Put the title back for everything else that reads the home page.
  await title.fill(original)
  await page.getByRole('button', { name: 'Publish changes' }).click()
  await expect(page.getByText(/updated successfully|published successfully/i).first()).toBeVisible({
    timeout: 15_000,
  })
})
