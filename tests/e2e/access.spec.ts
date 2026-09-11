import { expect, test } from '@playwright/test'

/** Access-control invariants that must never regress. */
test.describe('public API access', () => {
  test('published programs are readable; drafts are not', async ({ request }) => {
    const res = await request.get('/api/programs?limit=50&depth=0')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.totalDocs).toBeGreaterThan(0)
    for (const doc of body.docs) expect(doc.status).toBe('published')
  })

  test('sessions never expose zoomPasscode publicly', async ({ request }) => {
    const res = await request.get('/api/sessions?limit=5&depth=0')
    expect(res.status()).toBe(200)
    const text = await res.text()
    expect(text).not.toContain('zoomPasscode')
  })

  test('applications and contact messages are closed to the public — read and create', async ({
    request,
  }) => {
    for (const c of ['applications', 'contact-messages']) {
      expect((await request.get(`/api/${c}`)).status()).toBe(403)
      expect(
        (
          await request.post(`/api/${c}`, { data: { fullName: 'x', email: 'x@example.com' } })
        ).status(),
      ).toBe(403)
    }
  })

  test('users list is not public', async ({ request }) => {
    expect((await request.get('/api/users')).status()).toBe(403)
  })
})

test('admin follows the browser language: Arabic browser gets an RTL Arabic admin', async ({
  browser,
}) => {
  const context = await browser.newContext({ locale: 'ar-PS' })
  const page = await context.newPage()
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/admin(\/|$)/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
  await expect(page.locator('html')).toHaveAttribute('dir', /rtl/i)
  await context.close()
})
