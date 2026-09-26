import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test'
import { staffConfigured, staffCredentials } from './helpers/staff'

/**
 * The activity log: every staff write lands in it, admins see it as a page, editors do
 * not see it at all. Needs the throwaway accounts from `scripts/e2e-staff.ts`; skips
 * without them.
 */
const admin = staffCredentials('ADMIN')
const editor = staffCredentials('EDITOR')
type Who = typeof admin

// The admin follows the browser language; the assertions below read the Arabic admin.
test.use({ locale: 'ar-PS' })

/**
 * One worker, in order — every test here signs in as the same two accounts, and Payload
 * loses a session when two logins for one account land at the same moment: login reads the
 * user's session list, appends to it, and writes it back, so the slower write drops the
 * faster one's row and that token is refused (403 on a read an admin is allowed). Under the
 * config's `fullyParallel`, four workers signed in at once and three were deauthorised
 * before their first request (2026-09-23). `default` (not `serial`) so a failure still lets
 * the rest of the file run.
 */
test.describe.configure({ mode: 'default' })

test.skip(
  !staffConfigured('ADMIN', 'EDITOR'),
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
  id: number
  action: string
  target: string
  docId: string | null
  title: string
  userEmail: string
  changes: { field: string; label: { ar: string }; from?: unknown; to?: unknown }[]
}

/** The rows a given account's own actions produced, asked for by name. */
async function rowsByUser(request: APIRequestContext, email: string): Promise<Row[]> {
  const res = await request.get(
    `/api/activity?where[userEmail][equals]=${encodeURIComponent(email)}` +
      '&sort=-createdAt&limit=20&depth=0',
  )
  expect(res.status(), await res.text()).toBe(200)
  return (await res.json()).docs
}

/**
 * The rows for one document, asked for by name.
 *
 * Reading the few most recent rows and filtering them here was enough until other specs
 * started writing to this log too — marking a register is staff activity, so `account.spec`
 * fills the same window, and the oldest of these three rows fell out of it (2026-09-24). A
 * query that names what it wants does not care what else the suite is doing.
 */
async function rowsFor(
  request: APIRequestContext,
  target: string,
  docId: number | string,
): Promise<Row[]> {
  const res = await request.get(
    `/api/activity?where[target][equals]=${target}&where[docId][equals]=${docId}` +
      '&sort=-createdAt&limit=20&depth=0',
  )
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

  const mine = await rowsFor(request, 'programs', id)
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
  // The list names the changed field; the row's page shows before and after, each in its own cell.
  const updateRow = rows.filter({ hasText: 'الحالة' })
  await expect(updateRow).toHaveCount(1)
  await updateRow.locator('a[href*="/admin/collections/activity/"]').first().click()
  await expect(page).toHaveURL(/\/admin\/collections\/activity\/\d+$/)
  const table = page.locator('.jaa-changes__table')
  await expect(table).toBeVisible()
  const cells = table.locator('tbody tr').first().locator('th, td')
  await expect(cells).toHaveText(['الحالة', 'مسودّة', 'منشور'])
  await page.goto('/admin/collections/activity')
  const settingsRow = page.locator('table tbody tr').filter({ hasText: 'إعدادات الموقع' }).first()
  await expect(settingsRow.locator('a[href$="/admin/globals/site-settings"]')).toBeVisible()
})

test('the admin’s own fetches are authorised in dev: no console error on the log or a row', async ({
  page,
}) => {
  // Cookie auth is accepted only from origins on Payload's CSRF list; with the site URL on
  // port 3000 and dev on 3001, the preferences and relationship fetches answered 401/403 on
  // every admin page (fixed in payload.config.ts by adding the dev origin).
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('response', (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`))
  await signIn(page, admin)
  await page.goto('/admin/collections/activity')
  await expect(page.locator('table')).toBeVisible()
  await page
    .locator('table tbody tr')
    .first()
    .locator('a[href*="/admin/collections/activity/"]')
    .first()
    .click()
  await expect(page.locator('.jaa-changes')).toBeVisible()
  await page.waitForTimeout(1500)
  expect(errors).toEqual([])
})

test('a login, a failed login, and a logout are rows too, and the action filter isolates them', async ({
  page,
}) => {
  const request = await api(page, admin)
  const wrongEmail = `nobody-${Date.now()}@example.test`
  const failed = await page.request.post('/api/users/login', {
    data: { email: wrongEmail, password: 'not-the-password' },
  })
  expect(failed.status()).toBe(401)
  const wrongPassword = await page.request.post('/api/users/login', {
    data: { email: editor.email, password: 'not-the-password' },
  })
  expect(wrongPassword.status()).toBe(401)
  const editorApi = await api(page, editor)
  expect((await editorApi.post('/api/users/logout')).status()).toBe(200)

  const failures = await request.get(
    `/api/activity?where[action][equals]=login-failed&sort=-createdAt&limit=5&depth=0`,
  )
  const rows = (await failures.json()).docs as Row[]
  expect(rows.every((r) => r.action === 'login-failed')).toBe(true)
  expect(rows.find((r) => r.title === wrongEmail)).toMatchObject({
    userEmail: wrongEmail,
    docId: null,
    changes: [expect.objectContaining({ field: 'reason' })],
  })
  expect(rows.find((r) => r.title === editor.email)).toBeTruthy()

  const recent = await rowsByUser(request, editor.email!)
  const login = recent.find((r) => r.action === 'login' && r.userEmail === editor.email)
  expect(login).toMatchObject({ target: 'users', title: editor.email })
  const logout = recent.find((r) => r.action === 'logout' && r.userEmail === editor.email)
  expect(logout).toMatchObject({ target: 'users', title: editor.email })

  // The page: the filter on Action shows only the failed attempts.
  await signIn(page, admin)
  await page.goto('/admin/collections/activity?where[or][0][and][0][action][equals]=login-failed')
  await expect(page.locator('table')).toBeVisible()
  const cells = page.locator('table tbody tr')
  await expect(cells.first()).toContainText('محاولة دخول فاشلة')
  await expect(cells.filter({ hasNotText: 'محاولة دخول فاشلة' })).toHaveCount(0)
})

test('a re-save with no change records the save and nothing else', async ({ page }) => {
  const request = await api(page, admin)
  const settings = await request.get('/api/globals/site-settings?locale=ar&depth=0')
  const { contactEmail } = (await settings.json()) as { contactEmail: string }
  await request.post('/api/globals/site-settings?locale=ar', { data: { contactEmail } })
  // Its own row, not simply the newest: account.spec creates accounts in another worker at
  // the same moment, and one of those rows landed on top here under a full suite (2026-09-25).
  const [row] = (await rowsByUser(request, admin.email!)).filter(
    (r) => r.target === 'site-settings',
  )
  expect(row).toMatchObject({ action: 'update', target: 'site-settings', changes: [] })
})

/**
 * The Next dev overlay's badge turns red on any issue it collects (a runtime error, a
 * hydration error, a compile diagnostic). Read its state, and the panel's text when set,
 * so a screenshot never quietly carries a red badge.
 */
async function devIssues(page: Page): Promise<string | null> {
  const portal = page.locator('nextjs-portal')
  if ((await portal.count()) === 0) return null
  return portal.evaluate((el) => {
    const deep = (root: ParentNode, sel: string): Element | null => {
      const hit = root.querySelector(sel)
      if (hit) return hit
      for (const n of root.querySelectorAll('*'))
        if (n.shadowRoot) {
          const h = deep(n.shadowRoot, sel)
          if (h) return h
        }
      return null
    }
    const root = el.shadowRoot!
    const badge = deep(root, '[data-next-badge]')
    if (badge?.getAttribute('data-error') !== 'true') return null
    ;(deep(root, '[data-issues-open]') as HTMLElement | null)?.click()
    return new Promise<string>((resolve) =>
      setTimeout(() => {
        const dlg = deep(root, '[data-nextjs-dialog], [role="dialog"]')
        resolve(
          (dlg?.textContent ?? 'issue set, no panel text').replace(/\s+/g, ' ').slice(0, 1500),
        )
      }, 800),
    )
  })
}

/**
 * `caret: 'initial'`: Playwright's default hides the text caret for a screenshot by setting
 * `caret-color: transparent` inline on inputs, and a full-page shot taken while Payload's
 * streamed table is still hydrating hands React that style as a server/client mismatch
 * (seen 2026-09-22 as a red "1 Issue" badge in the screenshots, one run in three).
 */
async function shoot(page: Page, name: string) {
  expect(await devIssues(page), `dev overlay issue before ${name}`).toBeNull()
  await page.screenshot({
    path: `.artifacts/screens/activity/${name}.png`,
    fullPage: true,
    caret: 'initial',
  })
}

/**
 * A program whose status was changed, and the id of the log row that recorded it — made
 * here so the detail screenshot always has something with a before and an after to show.
 */
async function statusChangeRow(page: Page): Promise<number> {
  const request = await api(page, admin)
  const stamp = Date.now()
  const created = await request.post('/api/programs?locale=ar', {
    data: {
      title: `برنامج لقطة ${stamp}`,
      slug: `e2e-screens-${stamp}`,
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

  const row = (await rowsFor(request, 'programs', id)).find((r) => r.action === 'update')
  expect(row, 'the status change should have been logged').toBeTruthy()

  // Tidy the program away. The log row survives a deletion — that is the point of a log —
  // but a published program that outlives this test does not: `account.spec` takes the
  // first program it finds as a student's, and a fresh one has no sessions, so leaving it
  // there failed two of that file's tests (2026-09-24).
  expect((await request.delete(`/api/programs/${id}`)).status()).toBe(200)
  return (row as unknown as { id: number }).id
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
    await page.setViewportSize({ width: 1440, height: 900 })

    // Open a row this test made, by id, rather than hunting the list for one with a status
    // change in it. The list is shared: every other spec writes to this log too, and under
    // parallel load a row that was on the first page when the shot was taken is on the
    // second by the time it is clicked (2026-09-24).
    await page.goto(`/admin/collections/activity/${await statusChangeRow(page)}`)
    await expect(page.locator('.jaa-changes__table')).toBeVisible()
    // The read-only selects show their value once the client form state has loaded.
    await expect(page.locator('#field-action').locator('xpath=..')).toContainText(/تعديل|Update/, {
      timeout: 15_000,
    })
    await shoot(page, `activity-detail-${locale}-1440`)
    await context.close()
  }
})
