import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test'

/**
 * The activity log: every staff write lands in it, admins see it as a page, editors do
 * not see it at all. Needs the throwaway accounts from `scripts/e2e-staff.ts`; skips
 * without them.
 */
const admin = { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD }
const editor = { email: process.env.E2E_EDITOR_EMAIL, password: process.env.E2E_EDITOR_PASSWORD }
const configured = !!(admin.email && admin.password && editor.email && editor.password)
type Who = typeof admin

// The admin follows the browser language; the assertions below read the Arabic admin.
test.use({ locale: 'ar-PS' })

test.skip(
  !configured,
  'set E2E_ADMIN_* and E2E_EDITOR_* (pnpm payload:tsx run scripts/e2e-staff.ts)',
)

/**
 * An API context signed in as `who`, with the token as a header: Payload accepts a cookie
 * only alongside a browser's Sec-Fetch-Site or an Origin on its CSRF list, and a bare API
 * call carries neither.
 */
async function api(page: Page, who: Who): Promise<APIRequestContext> {
  const res = await page.request.post('/api/users/login', { data: who })
  expect(res.status(), await res.text()).toBe(200)
  const { token } = (await res.json()) as { token: string }
  return request.newContext({
    baseURL: test.info().project.use.baseURL,
    extraHTTPHeaders: { Authorization: `JWT ${token}` },
  })
}

/** Signs the browser itself in, for the admin pages. */
async function signIn(page: Page, who: Who) {
  const res = await page.request.post('/api/users/login', { data: who })
  expect(res.status(), await res.text()).toBe(200)
}

type Row = {
  action: string
  target: string
  docId: string | null
  title: string
  userEmail: string
  changes: { field: string; label: { ar: string }; from?: unknown; to?: unknown }[]
}

async function latest(request: APIRequestContext, limit = 5): Promise<Row[]> {
  const res = await request.get(`/api/activity?limit=${limit}&sort=-createdAt&depth=0`)
  expect(res.status(), await res.text()).toBe(200)
  return (await res.json()).docs
}

test('an editor cannot read the log, and does not see it in the admin', async ({ page }) => {
  const request = await api(page, editor)
  expect((await request.get('/api/activity')).status()).toBe(403)
  await page.goto('/admin')
  await expect(page.locator('a[href$="/admin/collections/programs"]').first()).toBeVisible()
  await expect(page.locator('a[href$="/admin/collections/activity"]')).toHaveCount(0)
  await page.goto('/admin/collections/activity')
  await expect(page.locator('table')).toHaveCount(0)
})

test('the log records create, update, and delete with the editor, the title, and the changed fields', async ({
  page,
}) => {
  const request = await api(page, admin)
  const stamp = Date.now()
  const title = `برنامج تجريبي ${stamp}`
  const created = await request.post('/api/programs?locale=ar', {
    data: {
      title,
      slug: `e2e-activity-${stamp}`,
      track: 'directed',
      registrationMode: 'closed',
      status: 'draft',
    },
  })
  expect(created.status(), await created.text()).toBe(201)
  const id = (await created.json()).doc.id as number
  const updated = await request.patch(`/api/programs/${id}?locale=ar`, {
    data: { status: 'published' },
  })
  expect(updated.status(), await updated.text()).toBe(200)
  expect((await request.delete(`/api/programs/${id}`)).status()).toBe(200)

  const mine = (await latest(request)).filter(
    (r) => r.target === 'programs' && r.docId === String(id),
  )
  expect(mine.map((r) => r.action)).toEqual(['delete', 'update', 'create'])
  for (const r of mine) {
    expect(r.userEmail).toBe(admin.email)
    expect(r.title).toBe(title)
  }
  expect(mine[1]!.changes).toEqual([
    expect.objectContaining({ field: 'status', from: 'draft', to: 'published' }),
  ])
  expect(mine[0]!.changes).toEqual([])
  expect(mine[2]!.changes).toEqual([])

  // A global save: always has a page to link to.
  const settings = await request.get('/api/globals/site-settings?locale=ar&depth=0')
  const { contactEmail } = (await settings.json()) as { contactEmail: string }
  const saved = await request.post('/api/globals/site-settings?locale=ar', {
    data: { contactEmail: `${contactEmail}` },
  })
  expect(saved.status(), await saved.text()).toBe(200)

  // The page: the list view, the document and the changes as words, the global linked.
  await signIn(page, admin)
  await page.goto('/admin/collections/activity')
  await expect(page.locator('table')).toBeVisible()
  const rows = page.locator('table tbody tr').filter({ hasText: title })
  await expect(rows).toHaveCount(3)
  await expect(rows.filter({ hasText: 'من «مسودّة» إلى «منشور»' })).toHaveCount(1)
  const settingsRow = page.locator('table tbody tr').filter({ hasText: 'إعدادات الموقع' }).first()
  await expect(settingsRow.locator('a[href$="/admin/globals/site-settings"]')).toBeVisible()
})

test('a re-save with no change records the save and nothing else', async ({ page }) => {
  const request = await api(page, admin)
  const settings = await request.get('/api/globals/site-settings?locale=ar&depth=0')
  const { contactEmail } = (await settings.json()) as { contactEmail: string }
  await request.post('/api/globals/site-settings?locale=ar', { data: { contactEmail } })
  const [row] = await latest(request, 1)
  expect(row).toMatchObject({ action: 'update', target: 'site-settings', changes: [] })
})

async function shoot(page: Page, name: string) {
  await page.screenshot({ path: `.artifacts/screens/activity/${name}.png`, fullPage: true })
}

test('screens', async ({ browser }) => {
  for (const locale of ['ar', 'en']) {
    const context = await browser.newContext({
      locale: locale === 'ar' ? 'ar-PS' : 'en-US',
      viewport: { width: 1440, height: 900 },
    })
    const page = await context.newPage()
    await signIn(page, admin)
    await page.goto('/admin/collections/activity')
    await expect(page.locator('table')).toBeVisible()
    // The time cell is server-rendered in the academy's zone: a date and a time, never a loader.
    const first = page.locator('table tbody tr').first()
    await expect(first).toContainText(
      locale === 'ar' ? /\d{1,2} \S+ \d{4}، \d{2}:\d{2}/ : /\d{1,2} \S+ \d{4}, \d{2}:\d{2}/,
    )
    await expect(first).not.toContainText(/التّحميل|Loading/)
    await shoot(page, `activity-${locale}-1440`)
    await page.setViewportSize({ width: 375, height: 812 })
    await shoot(page, `activity-${locale}-375`)
    await context.close()
  }
})
