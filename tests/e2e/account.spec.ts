import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test'
import { submitApplication } from './helpers/apply'

/**
 * The account and its doors (PLAN.md §13.8, step 2): acceptance opens the account, the
 * window is behind a sign-in, and an account is not staff.
 *
 * One thing here is deliberately not end-to-end: following the invite link itself. The
 * token lives in a letter, and a Playwright run has no mailbox — Payload also hides the
 * reset token from its own API, which is right and which we are not going to loosen for a
 * test. So the letter's contents are pinned in `tests/unit/account-forms.test.ts`, and the
 * spec below proves everything either side of it: the account appears with an invite
 * stamped, and a token that is not real is refused with a way forward.
 *
 * Needs the throwaway staff accounts from `scripts/e2e-staff.ts`; skips without them.
 */
// This spec's own admin, not the one `activity.spec.ts` uses: two logins for a single
// account at the same moment lose each other's session, and spec files run in parallel.
const admin = {
  email: process.env.E2E_ADMIN_C_EMAIL,
  password: process.env.E2E_ADMIN_C_PASSWORD,
}

test.skip(
  !(admin.email && admin.password),
  'set E2E_ADMIN_C_* (pnpm payload:tsx run scripts/e2e-staff.ts)',
)

// One worker, in order: Payload drops a session when two logins for one account land at the
// same moment — see the note at the top of `activity.spec.ts`.
test.describe.configure({ mode: 'default' })

async function staffApi(page: Page): Promise<APIRequestContext> {
  const res = await page.request.post('/api/users/login', { data: admin })
  expect(res.status(), await res.text()).toBe(200)
  const { token } = (await res.json()) as { token: string }
  return request.newContext({
    baseURL: test.info().project.use.baseURL,
    extraHTTPHeaders: { Authorization: `JWT ${token}` },
  })
}

type Account = {
  id: number
  email: string
  kind: string
  name: string
  inviteSentAt: string | null
  passwordSetAt: string | null
}

async function findAccount(api: APIRequestContext, email: string): Promise<Account | undefined> {
  const res = await api.get(`/api/accounts?where[email][equals]=${encodeURIComponent(email)}`)
  expect(res.status(), await res.text()).toBe(200)
  return ((await res.json()).docs as Account[])[0]
}

/**
 * An accepted applicant, and the account acceptance opened for them. Used by the one test
 * that is about that path: the apply form is rate limited (five submissions per ten minutes
 * per IP) and the suite already spends most of that budget in `apply.spec.ts` and
 * `application-status.spec.ts`, so everything that merely needs *an account* makes one
 * directly as staff instead.
 */
async function acceptedApplicant(page: Page) {
  const email = `playwright-account-${Date.now()}@example.com`
  await submitApplication(page, 'ar', email)
  const api = await staffApi(page)
  const { docs } = await (
    await api.get(`/api/applications?where[email][equals]=${encodeURIComponent(email)}`)
  ).json()
  const application = docs[0] as { id: number }
  const patch = await api.patch(`/api/applications/${application.id}`, {
    data: { applicationStatus: 'accepted' },
  })
  expect(patch.status(), await patch.text()).toBe(200)
  return { api, email, applicationId: application.id }
}

/**
 * An activated account with a password we know. Staff set it here only because a test has
 * no mailbox; a real student chooses their own from the invite and staff never know it.
 */
async function activatedAccount(page: Page) {
  const api = await staffApi(page)
  const email = `playwright-signin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`
  const password = `pw-${Date.now()}-playwright`
  const res = await api.post('/api/accounts', {
    data: { email, password, kind: 'student', name: 'Playwright Student', locale: 'ar' },
  })
  expect(res.status(), await res.text()).toBe(201)
  const { doc } = (await res.json()) as { doc: Account }
  return { api, email, password, account: doc }
}

test('acceptance opens the account, invited but not yet activated', async ({ page }) => {
  const { api, email, applicationId } = await acceptedApplicant(page)

  const account = await findAccount(api, email)
  expect(account, 'acceptance should have opened an account').toBeTruthy()
  expect(account).toMatchObject({ kind: 'student', email })
  expect(account!.inviteSentAt, 'the invite should be stamped').toBeTruthy()
  // Nobody has chosen a password yet — the letter is the only way in.
  expect(account!.passwordSetAt).toBeFalsy()

  // The account is tied to the application it came from.
  const full = await (await api.get(`/api/accounts/${account!.id}?depth=0`)).json()
  expect(full.application).toBe(applicationId)

  // Staff correct the status and set it back: a second identity would be a real problem.
  for (const applicationStatus of ['reviewing', 'accepted'] as const) {
    const res = await api.patch(`/api/applications/${applicationId}`, {
      data: { applicationStatus },
    })
    expect(res.status(), await res.text()).toBe(200)
  }
  const again = await api.get(`/api/accounts?where[email][equals]=${encodeURIComponent(email)}`)
  expect((await again.json()).totalDocs).toBe(1)
})

test('the window is behind the door: signed out, /account sends you to sign in', async ({
  page,
}) => {
  await page.goto('/ar/account')
  await expect(page).toHaveURL(/\/ar\/account\/sign-in$/)
  await expect(page.getByLabel('البريد الإلكتروني')).toBeVisible()
})

test('a student signs in, sees their window, and signs out again', async ({ page }) => {
  const { email, password } = await activatedAccount(page)

  await page.goto('/ar/account/sign-in')
  await page.getByLabel('البريد الإلكتروني').fill(email)
  await page.getByLabel(/^كلمة السر/).fill(password)
  await page.getByRole('button', { name: 'دخول' }).click()

  await expect(page).toHaveURL(/\/ar\/account$/)
  await expect(page.getByText(email)).toBeVisible()
  await expect(page.getByText('طالب', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'خروج' }).click()
  await expect(page).toHaveURL(/\/ar\/account\/sign-in$/)
  // The cookie is gone, not merely the page.
  await page.goto('/ar/account')
  await expect(page).toHaveURL(/\/ar\/account\/sign-in$/)
})

test('a wrong password says one thing, and says it about neither field', async ({ page }) => {
  const { email } = await activatedAccount(page)
  await page.goto('/ar/account/sign-in')
  await page.getByLabel('البريد الإلكتروني').fill(email)
  await page.getByLabel(/^كلمة السر/).fill('not-the-password')
  await page.getByRole('button', { name: 'دخول' }).click()
  await expect(page.locator('form').getByRole('alert')).toContainText(
    'البريد أو كلمة السر غير صحيح',
  )
  await expect(page).toHaveURL(/\/ar\/account\/sign-in$/)
})

test('the reset form answers the same way to an address it knows and one it does not', async ({
  page,
}) => {
  const { email } = await activatedAccount(page)
  const answers: string[] = []
  for (const address of [email, `nobody-${Date.now()}@example.com`]) {
    await page.goto('/ar/account/forgot')
    await page.getByLabel('البريد الإلكتروني').fill(address)
    await page.getByRole('button', { name: 'أرسل الرابط' }).click()
    const sent = page.getByText('تفقّد بريدك')
    await expect(sent).toBeVisible()
    answers.push((await page.locator('main').innerText()).trim())
  }
  expect(answers[0]).toBe(answers[1])
})

test('an invented set-password token is refused, with a way forward', async ({ page }) => {
  await page.goto('/ar/account/set-password?token=this-token-was-never-issued')
  await page.getByLabel('كلمة السر الجديدة').fill('a-perfectly-fine-password')
  await page.getByLabel('أعد كتابة كلمة السر').fill('a-perfectly-fine-password')
  await page.getByRole('button', { name: 'احفظ وادخل' }).click()
  await expect(page.locator('form').getByRole('alert')).toContainText('انتهت صلاحية هذا الرابط')
  await expect(page.getByRole('link', { name: 'اطلب رابطًا جديدًا' })).toBeVisible()
})

test('the set-password page without a token asks for the real link instead', async ({ page }) => {
  await page.goto('/ar/account/set-password')
  await expect(page.getByText('الرابط ناقص')).toBeVisible()
  await expect(page.getByLabel('كلمة السر الجديدة')).toHaveCount(0)
})

test('an account is not staff: no admin, and no reading anyone else', async ({ page }) => {
  const { email, password, account } = await activatedAccount(page)

  const login = await page.request.post('/api/accounts/login', { data: { email, password } })
  expect(login.status(), await login.text()).toBe(200)
  const { token } = (await login.json()) as { token: string }
  const asAccount = await request.newContext({
    baseURL: test.info().project.use.baseURL,
    extraHTTPHeaders: { Authorization: `JWT ${token}` },
  })

  // Itself, and only itself.
  expect((await asAccount.get(`/api/accounts/${account.id}`)).status()).toBe(200)
  expect((await asAccount.get('/api/accounts')).status()).toBe(200)
  expect((await (await asAccount.get('/api/accounts')).json()).totalDocs).toBe(1)

  // Nothing that belongs to staff.
  for (const path of ['/api/applications', '/api/activity', '/api/users', '/api/contact-messages'])
    expect((await asAccount.get(path)).status(), path).toBe(403)

  // Payload grants an account no admin at all: the key it would set is simply absent.
  const access = await (await asAccount.get('/api/access')).json()
  expect(access.canAccessAdmin).toBeFalsy()

  // The login above went through this page's own request context, so the browser is
  // already carrying the account's cookie — the admin still turns it away.
  await page.goto('/ar/account')
  await expect(page).toHaveURL(/\/ar\/account$/)

  // Payload sends them to its own «غير مصرّح» page rather than to any dashboard.
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/admin\/unauthorized$/)
  await expect(page).not.toHaveURL(/\/admin\/collections/)
})
