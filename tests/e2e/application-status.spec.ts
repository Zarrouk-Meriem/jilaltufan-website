import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test'
import { isDevServer } from './helpers/dev'
import { submitApplication } from './helpers/apply'

/**
 * The follow-up link an applicant gets in the confirmation letter (PLAN.md §13.3): it is
 * minted with the application, it shows that one application and nothing else, an unknown
 * token is a 404, and an expired one shows no status at all — only the offer of a new link.
 *
 * Reading the token back needs a staff account, so this spec needs the throwaway accounts
 * from `scripts/e2e-staff.ts` and skips without them, as `activity.spec.ts` does.
 */
const admin = { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD }

test.skip(
  !(admin.email && admin.password),
  'set E2E_ADMIN_* (pnpm payload:tsx run scripts/e2e-staff.ts)',
)

// One worker, in order: Payload drops a session when two logins for one account land at the
// same moment — see the note at the top of `activity.spec.ts`.
test.describe.configure({ mode: 'default' })

async function api(page: Page): Promise<APIRequestContext> {
  const res = await page.request.post('/api/users/login', { data: admin })
  expect(res.status(), await res.text()).toBe(200)
  const { token } = (await res.json()) as { token: string }
  return request.newContext({
    baseURL: test.info().project.use.baseURL,
    extraHTTPHeaders: { Authorization: `JWT ${token}` },
  })
}

type Row = { id: number; fullName: string; statusToken: string; statusLink: string }

/** The application behind an address, as staff see it. */
async function find(api: APIRequestContext, email: string): Promise<Row> {
  const res = await api.get(`/api/applications?where[email][equals]=${encodeURIComponent(email)}`)
  expect(res.status(), await res.text()).toBe(200)
  const docs = (await res.json()).docs as Row[]
  const doc = docs[0]
  expect(doc, `no application for ${email}`).toBeTruthy()
  return doc!
}

test('an application is born with a follow-up link, and the link shows its status', async ({
  page,
}) => {
  const email = `playwright-status-${Date.now()}@example.com`
  await submitApplication(page, 'ar', email)
  const staff = await api(page)
  const doc = await find(staff, email)

  // Minted with the row, and offered to staff as a finished link they could send on.
  expect(doc.statusToken).toMatch(/^[A-Za-z0-9_-]{32}$/)
  expect(doc.statusLink).toContain(`/ar/application/${doc.statusToken}`)

  await page.goto(`/ar/application/${doc.statusToken}`)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('متابعة')
  // «جديد» is the status a fresh application carries.
  await expect(page.getByText('وصل الطلب', { exact: true })).toBeVisible()
  await expect(page.locator('main')).toContainText('احتفظ بهذا الرابط لنفسك')

  // The page is private: never indexed, never cached, and it does not offer the token to
  // the world as three hreflang alternates.
  const res = await page.goto(`/ar/application/${doc.statusToken}`)
  expect(res?.headers()['referrer-policy']).toBe('no-referrer')
  expect(res?.headers()['link'] ?? '').not.toContain('hreflang')
  // `next dev` sets its own Cache-Control over the proxy's; the strict value is a
  // production property (CLAUDE.md: test headers against build + start).
  expect(res?.headers()['cache-control']).toContain(
    (await isDevServer(page)) ? 'must-revalidate' : 'no-store',
  )
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /noindex(,\s*|\s+)nofollow/,
  )
})

test('the link follows the status the staff set, in the applicant’s own language', async ({
  page,
}) => {
  const email = `playwright-status-en-${Date.now()}@example.com`
  await submitApplication(page, 'en', email)
  const staff = await api(page)
  const doc = await find(staff, email)

  const patch = await staff.patch(`/api/applications/${doc.id}`, {
    data: { applicationStatus: 'waitlisted' },
  })
  expect(patch.status(), await patch.text()).toBe(200)

  await page.goto(`/en/application/${doc.statusToken}`)
  await expect(page.getByText('Waiting list', { exact: true })).toBeVisible()
  await expect(page.locator('main')).toContainText('no need to apply again')
})

test('an unknown token is a 404, exactly like a made-up one', async ({ page }) => {
  const res = await page.goto('/ar/application/this-token-was-never-issued')
  expect(res?.status()).toBe(404)
})

test('an expired link shows no status — only the offer of a new one', async ({ page }) => {
  const email = `playwright-status-old-${Date.now()}@example.com`
  await submitApplication(page, 'ar', email)
  const staff = await api(page)
  const doc = await find(staff, email)

  const patch = await staff.patch(`/api/applications/${doc.id}`, {
    data: { statusTokenExpiresAt: '2020-01-01T00:00:00.000Z' },
  })
  expect(patch.status(), await patch.text()).toBe(200)

  await page.goto(`/ar/application/${doc.statusToken}`)
  await expect(page.getByText('انتهت صلاحية هذا الرابط')).toBeVisible()
  // The status itself is gone: an old letter in a mailbox stops answering.
  await expect(page.getByText('وصل الطلب', { exact: true })).toHaveCount(0)

  await page.getByRole('button', { name: 'أرسل رابطًا جديدًا' }).click()
  await expect(page.getByRole('status')).toContainText('أرسلنا رابطًا جديدًا')

  // The new link replaces the old one, which stops working entirely.
  const after = await find(staff, email)
  expect(after.statusToken).not.toBe(doc.statusToken)
  const res = await page.goto(`/ar/application/${doc.statusToken}`)
  expect(res?.status()).toBe(404)
})
