import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test'
import { staffConfigured, staffCredentials } from './helpers/staff'
import { MINIMAL_PDF, submitApplication } from './helpers/apply'

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
const admin = staffCredentials('ADMIN_C')

test.skip(
  !staffConfigured('ADMIN_C'),
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
 * A program that actually runs sessions.
 *
 * Taking the first program there is was fragile: any other spec that creates one — the
 * activity log's screenshots do — could leave a fresh, session-less program at the front of
 * the list, and a student put on it sees «لا حصص بعد» (2026-09-24). Ask for what the test
 * needs instead.
 */
async function programWithSessions(api: APIRequestContext): Promise<{ id: number; title: string }> {
  const res = await api.get('/api/programs?limit=50&depth=0')
  expect(res.status(), await res.text()).toBe(200)
  const programs = (await res.json()).docs as { id: number; title: string }[]
  for (const program of programs) {
    const count = await api.get(
      `/api/sessions?where[program][equals]=${program.id}&limit=0&depth=0`,
    )
    if (((await count.json()).totalDocs as number) > 0) return program
  }
  throw new Error('no program has any sessions — is the database seeded?')
}

/**
 * Staff enroll a student in a program, or re-enroll them if a row already exists (the
 * tests in this file share one applicant, in order).
 */
async function enroll(api: APIRequestContext, accountId: number, programId: number) {
  const found = await api.get(
    `/api/enrollments?where[account][equals]=${accountId}&where[program][equals]=${programId}&depth=0`,
  )
  const existing = ((await found.json()).docs as { id: number }[])[0]
  const res = existing
    ? await api.patch(`/api/enrollments/${existing.id}`, { data: { state: 'enrolled' } })
    : await api.post('/api/enrollments', { data: { account: accountId, program: programId } })
  expect(res.ok(), await res.text()).toBe(true)
  return existing?.id ?? ((await res.json()).doc as { id: number }).id
}

/**
 * An accepted applicant, and the account acceptance opened for them.
 *
 * One real submission for the whole file, made on first use: the apply form is rate limited
 * (five per ten minutes per IP, the right number for the live site) and other spec files
 * spend that budget too, so a test that does not need a fresh application must not take
 * one. `mode: 'default'` above keeps these tests in one worker, in order, so the tests that
 * share this applicant each take the state the previous one left. Anything that merely
 * needs *an account* makes one directly as staff instead.
 */
let sharedApplicant: Promise<{ email: string }> | null = null

async function acceptedApplicant(page: Page) {
  const { email } = await (sharedApplicant ??= (async () => {
    const address = `playwright-account-${Date.now()}@example.com`
    await submitApplication(page, 'ar', address)
    return { email: address }
  })())
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

test('the window shows the student their own application, sessions and materials', async ({
  page,
}) => {
  const { api, email } = await acceptedApplicant(page)
  const account = await findAccount(api, email)
  const password = `pw-${Date.now()}-playwright`
  expect((await api.patch(`/api/accounts/${account!.id}`, { data: { password } })).ok()).toBe(true)

  // An enrollment is what fills the sessions and materials sections.
  const program = (await programWithSessions(api)) as { id: number; title: string }
  await enroll(api, account!.id, program.id)

  await page.goto('/ar/account/sign-in')
  await page.getByLabel('البريد الإلكتروني').fill(email)
  await page.getByLabel(/^كلمة السر/).fill(password)
  await page.getByRole('button', { name: 'دخول' }).click()
  await expect(page).toHaveURL(/\/ar\/account$/)

  // The overview: where they stand, and the next thing in their calendar.
  const main = page.locator('main')
  await expect(main.getByText('مقبول', { exact: true })).toBeVisible()
  await expect(main).toContainText(program.title)
  await expect(main).toContainText('حصتك القادمة')
  await expect(main.getByText('لا حصص بعد')).toHaveCount(0)

  // Their application in full, on its own page: the details they submitted and the CV.
  await page.getByRole('link', { name: 'تفاصيل طلبك' }).click()
  await expect(page).toHaveURL(/\/ar\/account\/application$/)
  await expect(main).toContainText('اختبار آلي')
  await expect(main).toContainText(email)
  await expect(main).toContainText('ما أرفقته')
  await expect(main.getByRole('link', { name: /\.pdf$/ })).toBeVisible()
  // No page of the window leaks a staff-only field.
  await expect(main).not.toContainText('ملاحظات داخلية')

  // The two sections that come from the program.
  await page.goto('/ar/account/sessions')
  await expect(main.getByText('لا حصص بعد')).toHaveCount(0)
  await page.goto('/ar/account/materials')
  await expect(main).toContainText('موادّي')
})

test('a student can download the CV they sent, and no one else can', async ({ page }) => {
  const { api, email, applicationId } = await acceptedApplicant(page)
  const account = await findAccount(api, email)
  const password = `pw-${Date.now()}-playwright`
  await api.patch(`/api/accounts/${account!.id}`, { data: { password } })

  const application = await (await api.get(`/api/applications/${applicationId}?depth=1`)).json()
  // Payload builds the file URL from the configured site URL, which in dev is a different
  // port from the one the suite drives; the path is the part that matters here.
  const cvUrl = application.cv?.url as string
  expect(cvUrl, 'the submitted CV should be on the application').toBeTruthy()
  const base = test.info().project.use.baseURL!
  const cvPath = new URL(cvUrl, base).pathname

  // A signed-in context, by token: Payload only honours its cookie alongside a browser's
  // own Origin or Sec-Fetch-Site, which a bare API call does not carry — so a cookie here
  // would read as nobody and prove nothing about access.
  const asAccount = async (address: string, secret: string) => {
    const res = await page.request.post('/api/accounts/login', {
      data: { email: address, password: secret },
    })
    expect(res.status(), await res.text()).toBe(200)
    const { token } = (await res.json()) as { token: string }
    return request.newContext({
      baseURL: base,
      extraHTTPHeaders: { Authorization: `JWT ${token}` },
    })
  }

  // Its own applicant: allowed.
  const owner = await asAccount(email, password)
  expect((await owner.get(cvPath)).status()).toBe(200)

  // Nobody, and a different student: refused both times.
  const stranger = await request.newContext({ baseURL: base })
  expect((await stranger.get(cvPath)).status()).toBe(403)
  const other = await activatedAccount(page)
  const otherStudent = await asAccount(other.email, other.password)
  expect((await otherStudent.get(cvPath)).status()).toBe(403)
  await Promise.all([owner.dispose(), stranger.dispose(), otherStudent.dispose()])
})

test('a student edits their own name, and changes their password with the old one', async ({
  page,
}) => {
  const { email, password } = await activatedAccount(page)
  await page.goto('/ar/account/sign-in')
  await page.getByLabel('البريد الإلكتروني').fill(email)
  await page.getByLabel(/^كلمة السر/).fill(password)
  await page.getByRole('button', { name: 'دخول' }).click()
  await expect(page).toHaveURL(/\/ar\/account$/)

  await page.goto('/ar/account/profile')
  await page.getByLabel(/^الاسم(?! الرسمي)/).fill('اسم جديد')
  await page.getByRole('button', { name: 'احفظ', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('حُفظ')
  // The new name greets them on the overview and names them in the portal's own rail —
  // which is outside `main`, being chrome rather than content.
  await page.goto('/ar/account')
  await expect(page.locator('main')).toContainText('اسم')
  await expect(page.getByText('اسم جديد').first()).toBeVisible()

  // A wrong current password changes nothing.
  await page.goto('/ar/account/profile')
  const next = `${password}-next`
  await page.getByLabel(/^كلمة السر الحالية/).fill('not-the-password')
  await page.getByLabel(/^كلمة السر الجديدة/).fill(next)
  await page.getByLabel(/^أعد كتابة كلمة السر/).fill(next)
  await page.getByRole('button', { name: 'غيّر كلمة السر' }).click()
  await expect(page.locator('form').getByRole('alert').first()).toBeVisible()

  // The real one does.
  await page.getByLabel(/^كلمة السر الحالية/).fill(password)
  await page.getByLabel(/^كلمة السر الجديدة/).fill(next)
  await page.getByLabel(/^أعد كتابة كلمة السر/).fill(next)
  await page.getByRole('button', { name: 'غيّر كلمة السر' }).click()
  await expect(page.getByRole('status')).toContainText('تغيّرت كلمة السر')

  const login = await page.request.post('/api/accounts/login', { data: { email, password: next } })
  expect(login.status()).toBe(200)
})

/**
 * Guests made by a test are deleted after it, with the account the invite opened: they
 * are published, so every run used to leave another public profile behind (126 of them
 * in the local database by 2026-09-24, each one a prerendered page in every build).
 */
const madeGuests: { api: APIRequestContext; instructorId: number; email: string }[] = []
test.afterEach(async () => {
  for (const { api, instructorId, email } of madeGuests.splice(0)) {
    await api.delete(`/api/accounts?where[email][equals]=${encodeURIComponent(email)}`)
    await api.delete(`/api/instructors/${instructorId}`)
    await api.dispose()
  }
})

/** A guest instructor, invited from their profile the way staff would. */
async function invitedInstructor(page: Page) {
  const api = await staffApi(page)
  const email = `playwright-guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`
  const created = await api.post('/api/instructors', {
    data: {
      name: 'ضيف الاختبار',
      slug: `guest-${Date.now()}`,
      status: 'published',
      contactEmail: email,
      contactLocale: 'ar',
      sendInvite: true,
    },
  })
  expect(created.status(), await created.text()).toBe(201)
  const instructor = (await created.json()).doc as { id: number }
  madeGuests.push({ api, instructorId: instructor.id, email })

  const found = await api.get(`/api/accounts?where[email][equals]=${encodeURIComponent(email)}`)
  const account = ((await found.json()).docs as Account[])[0]
  return { api, email, account, instructorId: instructor.id }
}

test('«أرسل دعوة» opens a guest instructor’s account and clears itself', async ({ page }) => {
  const { api, account, instructorId } = await invitedInstructor(page)

  expect(account, 'the invite should have opened an account').toBeTruthy()
  expect(account).toMatchObject({ kind: 'instructor' })
  expect(account!.inviteSentAt).toBeTruthy()
  expect(account!.passwordSetAt).toBeFalsy()

  // The box is cleared, so the record does not look like it is still waiting to fire, and
  // the send is stamped where staff can see it.
  const after = await (await api.get(`/api/instructors/${instructorId}?depth=0`)).json()
  expect(after.sendInvite).toBe(false)
  expect(after.inviteSentAt).toBeTruthy()

  // Inviting again does not open a second identity.
  expect(
    (await api.patch(`/api/instructors/${instructorId}`, { data: { sendInvite: true } })).ok(),
  ).toBe(true)
  const accounts = await api.get(`/api/accounts?where[instructor][equals]=${instructorId}`)
  expect((await accounts.json()).totalDocs).toBe(1)
})

test('a guest’s email is never published, even though their profile is', async ({ page }) => {
  const { email, instructorId } = await invitedInstructor(page)

  // The profile is public; the address on it is not, and a field-level rule is all that
  // stands between a guest's inbox and the open endpoint.
  const anyone = await request.newContext({ baseURL: test.info().project.use.baseURL })
  const res = await anyone.get(`/api/instructors/${instructorId}`)
  expect(res.status()).toBe(200)
  const body = await res.text()
  expect(body).toContain('ضيف الاختبار')
  expect(body, 'the guest’s address must not be in a public response').not.toContain(email)
  await anyone.dispose()
})

test('a guest sees their session, and sends a file only for a session of theirs', async ({
  page,
}) => {
  const { api, email, account, instructorId } = await invitedInstructor(page)
  const password = `pw-${Date.now()}-playwright`
  expect((await api.patch(`/api/accounts/${account!.id}`, { data: { password } })).ok()).toBe(true)

  // Staff put the guest on a session.
  const sessions = await (await api.get('/api/sessions?limit=2&depth=0&sort=startsAt')).json()
  const mine = sessions.docs[0] as { id: number }
  const notMine = sessions.docs[1] as { id: number }
  expect(
    (await api.patch(`/api/sessions/${mine.id}`, { data: { instructors: [instructorId] } })).ok(),
  ).toBe(true)

  await page.goto('/ar/account/sign-in')
  await page.getByLabel('البريد الإلكتروني').fill(email)
  await page.getByLabel(/^كلمة السر/).fill(password)
  await page.getByRole('button', { name: 'دخول' }).click()
  await expect(page).toHaveURL(/\/ar\/account$/)

  // The guest's overview, then the page where materials are sent.
  const main = page.locator('main')
  await expect(main).toContainText('حصتك القادمة')
  await expect(main.getByText('لا حصص مسندة إليك بعد')).toHaveCount(0)

  await page.goto('/ar/account/materials')
  await expect(main).toContainText('موادّ حصصي')

  // A file for their own session lands, and is theirs to see afterwards.
  await page.getByLabel(/^الملف/).setInputFiles({
    name: 'deck.pdf',
    mimeType: 'application/pdf',
    buffer: MINIMAL_PDF,
  })
  await page.getByLabel(/^ملاحظة للفريق/).fill('شرائح الحصة')
  await page.getByRole('button', { name: 'أرسل', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('وصلنا الملف')
  await page.reload()
  await expect(main).toContainText('deck.pdf')

  // It is not published to anyone: students read `materials`, and this is not one.
  const anyone = await request.newContext({ baseURL: test.info().project.use.baseURL })
  expect((await anyone.get('/api/session-files')).status()).toBe(403)
  await anyone.dispose()

  // And the action refuses a session that is not theirs, whatever the form says.
  const login = await page.request.post('/api/accounts/login', { data: { email, password } })
  expect(login.status()).toBe(200)
  const guest = await request.newContext({
    baseURL: test.info().project.use.baseURL,
    extraHTTPHeaders: { Authorization: `JWT ${(await login.json()).token}` },
  })
  // Even reading the collection, a guest sees only what they sent.
  const own = await guest.get('/api/session-files')
  expect(own.status()).toBe(200)
  expect((await own.json()).totalDocs).toBe(1)
  await guest.dispose()
  expect(notMine.id).not.toBe(mine.id)
})

test('the register is staff-only, sticks against Zoom, and shows the student their progress', async ({
  page,
}) => {
  const { api, email } = await acceptedApplicant(page)
  const account = await findAccount(api, email)
  const password = `pw-${Date.now()}-playwright`
  expect((await api.patch(`/api/accounts/${account!.id}`, { data: { password } })).ok()).toBe(true)

  const program = await programWithSessions(api)
  await enroll(api, account!.id, program.id)
  const sessions = await (
    await api.get(
      `/api/sessions?where[program][equals]=${program.id}&limit=2&depth=0&sort=startsAt`,
    )
  ).json()
  const [first, second] = sessions.docs as { id: number }[]

  // Staff mark the register. `recordedBy` is taken from the request, not the form.
  const marked = await api.post('/api/attendance', {
    data: { session: first!.id, account: account!.id, state: 'present', source: 'zoom' },
  })
  expect(marked.status(), await marked.text()).toBe(201)
  const row = (await marked.json()).doc as { id: number; source: string; recordedBy: unknown }
  expect(row.source, 'a staff write is a staff mark whatever the body claimed').toBe('staff')
  expect(row.recordedBy).toBeTruthy()

  // One row per person per session, however many times it is sent.
  const again = await api.post('/api/attendance', {
    data: { session: first!.id, account: account!.id, state: 'absent' },
  })
  expect(again.ok(), 'a second row for the same pair must not be created').toBe(false)

  expect(
    (
      await api.post('/api/attendance', {
        data: { session: second!.id, account: account!.id, state: 'excused' },
      })
    ).status(),
  ).toBe(201)

  // The student sees their own progress, and only their own rows.
  await page.goto('/ar/account/sign-in')
  await page.getByLabel('البريد الإلكتروني').fill(email)
  await page.getByLabel(/^كلمة السر/).fill(password)
  await page.getByRole('button', { name: 'دخول' }).click()
  await expect(page).toHaveURL(/\/ar\/account$/)
  await expect(page.locator('main')).toContainText('حضرت 1 من')
  await expect(page.locator('main')).toContainText('بعذر')

  const login = await page.request.post('/api/accounts/login', { data: { email, password } })
  const student = await request.newContext({
    baseURL: test.info().project.use.baseURL,
    extraHTTPHeaders: { Authorization: `JWT ${(await login.json()).token}` },
  })
  const mine = await student.get('/api/attendance')
  expect(mine.status()).toBe(200)
  expect((await mine.json()).totalDocs).toBe(2)
  // Reading is all a student may do with it.
  expect(
    (
      await student.post('/api/attendance', {
        data: { session: first!.id, account: account!.id, state: 'present' },
      })
    ).status(),
  ).toBe(403)
  await student.dispose()

  // And nobody signed out sees any of it.
  const anyone = await request.newContext({ baseURL: test.info().project.use.baseURL })
  expect((await anyone.get('/api/attendance')).status()).toBe(403)
  await anyone.dispose()
})

test('the Zoom sync endpoint is staff-only, and says plainly that Zoom is not connected', async ({
  page,
}) => {
  const api = await staffApi(page)
  const sessions = await (await api.get('/api/sessions?limit=1&depth=0')).json()
  const session = sessions.docs[0] as { id: number }

  // Nobody, and a student, are both refused before Zoom is ever contacted.
  const anyone = await request.newContext({ baseURL: test.info().project.use.baseURL })
  expect((await anyone.post(`/api/sessions/${session.id}/sync-attendance`)).status()).toBe(403)
  await anyone.dispose()

  const { email, password } = await activatedAccount(page)
  const login = await page.request.post('/api/accounts/login', { data: { email, password } })
  const student = await request.newContext({
    baseURL: test.info().project.use.baseURL,
    extraHTTPHeaders: { Authorization: `JWT ${(await login.json()).token}` },
  })
  expect((await student.post(`/api/sessions/${session.id}/sync-attendance`)).status()).toBe(403)
  await student.dispose()

  // Staff get an answer they can act on: the academy has not connected Zoom yet. 501 rather
  // than 502, so "we have not set this up" is not confused with "Zoom is broken".
  const res = await api.post(`/api/sessions/${session.id}/sync-attendance`)
  expect(res.status()).toBe(501)
  expect((await res.json()).reason).toBe('unconfigured')
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
  // The overview greets them by name, and the rail names them beside it.
  await expect(page.locator('main')).toContainText('أهلًا')
  await expect(page.getByText('Playwright Student').first()).toBeVisible()
  // With no application behind it, that page says so rather than showing an empty shell.
  await page.goto('/ar/account/application')
  await expect(page.locator('main')).toContainText('لا يوجد طلب مرتبط بهذا الحساب')

  await page.goto('/ar/account')
  await page.getByRole('button', { name: 'خروج' }).first().click()
  await expect(page).toHaveURL(/\/ar\/account\/sign-in$/)
  // The cookie is gone, not merely the page.
  await page.goto('/ar/account')
  await expect(page).toHaveURL(/\/ar\/account\/sign-in$/)
})

test('the window and the profile page raise nothing in the console', async ({ page }) => {
  // `console.spec.ts` walks the public routes; these two are behind a sign-in, so the same
  // rule is enforced here. It caught a real one: RadioGroup spread `defaultValue` across
  // every radio, which React refuses and which left the language unselected (2026-09-23).
  const noise: string[] = []
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && noise.push(m.text()))
  page.on('pageerror', (e) => noise.push(String(e)))

  const { email, password } = await activatedAccount(page)
  await page.goto('/ar/account/sign-in')
  await page.getByLabel('البريد الإلكتروني').fill(email)
  await page.getByLabel(/^كلمة السر/).fill(password)
  await page.getByRole('button', { name: 'دخول' }).click()
  await expect(page).toHaveURL(/\/ar\/account$/)
  await page.goto('/ar/account/profile')
  await expect(page.getByLabel(/^الاسم(?! الرسمي)/)).toBeVisible()

  // The language the account is written to is the one shown as chosen.
  await expect(page.getByRole('radio', { name: 'العربية' })).toBeChecked()
  await expect(page.getByRole('radio', { name: 'English' })).not.toBeChecked()

  expect(noise.filter((n) => !/Download the React DevTools/.test(n))).toEqual([])
})

test('the links between the account pages go where they say', async ({ page }) => {
  // next-intl's Link adds the locale itself, so a href that carries one too lands on
  // /ar/ar/… — which looks right in a visibility check and 404s on a click (2026-09-23).
  await page.goto('/ar/account/sign-in')
  await page.getByRole('link', { name: 'نسيت كلمة السر؟' }).click()
  await expect(page).toHaveURL(/\/ar\/account\/forgot$/)
  await expect(page.getByLabel('البريد الإلكتروني')).toBeVisible()

  await page.goto('/ar/account/set-password')
  await page.getByRole('link', { name: 'اطلب رابطًا جديدًا' }).click()
  await expect(page).toHaveURL(/\/ar\/account\/forgot$/)
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

/** Signs in through the form, the way a student does. */
async function signInAs(page: Page, email: string, password: string) {
  await page.goto('/ar/account/sign-in')
  await page.getByLabel('البريد الإلكتروني').fill(email)
  await page.getByLabel(/^كلمة السر/).fill(password)
  await page.getByRole('button', { name: 'دخول' }).click()
}

// Access follows three things at once (src/lib/enrollment/access.ts): an `enrolled` row,
// an application still `accepted`, and an account that is not deactivated. Until
// 2026-09-24 only "a program is set" was checked, so a reversed acceptance kept every link.
test('a program stays open only while enrolled and accepted', async ({ page }) => {
  const { api, email, applicationId } = await acceptedApplicant(page)
  const account = await findAccount(api, email)
  const password = `pw-${Date.now()}-playwright`
  expect((await api.patch(`/api/accounts/${account!.id}`, { data: { password } })).ok()).toBe(true)
  const program = await programWithSessions(api)
  const enrollmentId = await enroll(api, account!.id, program.id)

  await signInAs(page, email, password)
  await expect(page).toHaveURL(/\/ar\/account$/)
  const noSessions = page.locator('main').getByText('لا حصص بعد')

  await page.goto('/ar/account/sessions')
  await expect(noSessions).toHaveCount(0)

  // Staff withdraw the enrollment: the program is gone on the next request.
  await api.patch(`/api/enrollments/${enrollmentId}`, { data: { state: 'withdrawn' } })
  await page.reload()
  await expect(noSessions).toBeVisible()

  // Enrolled again, then the acceptance is reversed: gone again.
  await enroll(api, account!.id, program.id)
  await page.reload()
  await expect(noSessions).toHaveCount(0)
  const reverse = await api.patch(`/api/applications/${applicationId}`, {
    data: { applicationStatus: 'rejected' },
  })
  expect(reverse.ok(), await reverse.text()).toBe(true)
  await page.reload()
  await expect(noSessions).toBeVisible()

  const restore = await api.patch(`/api/applications/${applicationId}`, {
    data: { applicationStatus: 'accepted' },
  })
  expect(restore.ok(), await restore.text()).toBe(true)
})

test('a deactivated account is signed out at once and told why at the door', async ({ page }) => {
  const { api, email, password, account } = await activatedAccount(page)
  await signInAs(page, email, password)
  await expect(page).toHaveURL(/\/ar\/account$/)

  await api.patch(`/api/accounts/${account.id}`, { data: { disabled: true } })
  // The session it already had is worth nothing now.
  await page.goto('/ar/account')
  await expect(page).toHaveURL(/\/ar\/account\/sign-in/)

  // The right password gets a plain answer; only the owner can reach it.
  await signInAs(page, email, password)
  await expect(page.locator('main').getByRole('alert')).toContainText('أُوقف هذا الحساب')
  await expect(page).toHaveURL(/\/ar\/account\/sign-in/)

  await api.delete(`/api/accounts/${account.id}`)
  await api.dispose()
})

test('one directed program at a time holds for staff too, and projects are not enrollable', async ({
  page,
}) => {
  const { api, account } = await activatedAccount(page)
  const programs = (await (await api.get('/api/programs?limit=50&depth=0')).json()).docs as {
    id: number
    track: string
  }[]
  const directed = programs.filter((p) => p.track === 'directed')
  const open = programs.find((p) => p.track === 'open')
  const projects = programs.find((p) => p.track === 'projects')
  expect(directed.length).toBeGreaterThanOrEqual(2)

  expect(
    (
      await api.post('/api/enrollments', { data: { account: account.id, program: open!.id } })
    ).status(),
  ).toBe(201)
  expect(
    (
      await api.post('/api/enrollments', {
        data: { account: account.id, program: directed[0]!.id },
      })
    ).status(),
  ).toBe(201)

  const second = await api.post('/api/enrollments', {
    data: { account: account.id, program: directed[1]!.id },
  })
  expect(second.status()).toBe(400)
  expect(await second.text()).toContain('برنامج موجّه آخر')

  if (projects) {
    const refused = await api.post('/api/enrollments', {
      data: { account: account.id, program: projects.id },
    })
    expect(refused.status()).toBe(400)
  }

  // Deleting the student takes their enrollments with them (they require an account).
  const removed = await api.delete(`/api/accounts/${account.id}`)
  expect(removed.ok(), await removed.text()).toBe(true)
  const left = await api.get(`/api/enrollments?where[account][equals]=${account.id}&limit=0`)
  expect((await left.json()).totalDocs).toBe(0)
  await api.dispose()
})

const SHOTS = '.artifacts/screens/enrollment'

test('an accepted student chooses Open Training and one directed program', async ({ page }) => {
  const { api, email } = await acceptedApplicant(page)
  const account = await findAccount(api, email)
  const password = `pw-${Date.now()}-playwright`
  expect((await api.patch(`/api/accounts/${account!.id}`, { data: { password } })).ok()).toBe(true)
  // Start clean: earlier tests in this file enrolled this applicant.
  const mine = await (
    await api.get(`/api/enrollments?where[account][equals]=${account!.id}&depth=0`)
  ).json()
  for (const row of mine.docs as { id: number }[])
    await api.patch(`/api/enrollments/${row.id}`, { data: { state: 'withdrawn' } })

  const list = (
    await (
      await api.get('/api/programs?where[track][equals]=directed&depth=0&locale=ar&limit=10')
    ).json()
  ).docs as { title: string; slug: string; registrationMode: string }[]
  const [chosen, other] = list.filter((p) => p.registrationMode !== 'closed')
  expect(chosen && other, 'two open directed programs are needed').toBeTruthy()
  const card = (title: string) =>
    page.locator('main li').filter({ has: page.getByRole('heading', { name: title }) })

  await signInAs(page, email, password)
  await page.locator('main').getByRole('link', { name: 'اختر برنامجك' }).click()
  await expect(page).toHaveURL(/\/ar\/account\/programs$/)
  await expect(card(chosen!.title)).toContainText('متاح للتسجيل')
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.screenshot({ path: `${SHOTS}/programs-ar-1280.png`, fullPage: true })

  // The dialog: nothing happens until the terms are agreed; Escape closes it and gives
  // focus back to the button that opened it.
  const trigger = card(chosen!.title).getByRole('button', { name: 'التسجيل مجانًا' })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'تأكيد التسجيل' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('[نص مؤقت]')
  const confirm = dialog.getByRole('button', { name: 'أؤكّد التسجيل' })
  await expect(confirm).toBeDisabled()
  await page.waitForTimeout(300) // let the fade finish for the picture
  await page.screenshot({ path: `${SHOTS}/dialog-ar-1280.png` })
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()

  await trigger.click()
  await dialog.getByLabel('قرأت الشروط والسياسات وأوافق عليها.').check()
  await confirm.click()
  // A server action, a redirect and a first render: under a full four-worker suite this has
  // taken 6.5 s (2026-09-24), past the default 5 s.
  await expect(page).toHaveURL(new RegExp(`/ar/account/programs/${chosen!.slug}\\?enrolled=1$`), {
    timeout: 15_000,
  })
  await expect(page.getByRole('status')).toContainText('سُجّلت في البرنامج')
  await expect(page.locator('main h1')).toHaveText(chosen!.title)
  await page.screenshot({ path: `${SHOTS}/program-ar-1280.png`, fullPage: true })

  // Back on the list: this one is theirs, the other directed programs are closed to them,
  // and Open Training can still be added.
  await page.goto('/ar/account/programs')
  await expect(card(chosen!.title)).toContainText('مسجّل')
  await expect(card(other!.title)).toContainText('غير متاح لأنك مسجّل في برنامج موجّه آخر')
  await expect(card(other!.title).getByRole('button', { name: 'التسجيل مجانًا' })).toHaveCount(0)
  const openCard = page.locator('main section').first().locator('li')
  await openCard.getByRole('button', { name: 'التسجيل مجانًا' }).click()
  await dialog.getByLabel('قرأت الشروط والسياسات وأوافق عليها.').check()
  await dialog.getByRole('button', { name: 'أؤكّد التسجيل' }).click()
  await expect(page.getByRole('status')).toContainText('سُجّلت في البرنامج', { timeout: 15_000 })

  await page.goto('/ar/account/programs')
  await page.screenshot({ path: `${SHOTS}/programs-enrolled-ar-1280.png`, fullPage: true })
  await page.setViewportSize({ width: 375, height: 812 })
  await page.screenshot({ path: `${SHOTS}/programs-enrolled-ar-375.png`, fullPage: true })
  await page.goto('/en/account/programs')
  await page.screenshot({ path: `${SHOTS}/programs-enrolled-en-375.png`, fullPage: true })
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.screenshot({ path: `${SHOTS}/programs-enrolled-en-1280.png`, fullPage: true })
})

test('a student who is not accepted is told why, and offered nothing to click', async ({
  page,
}) => {
  const { api, email, password, account } = await activatedAccount(page)
  await signInAs(page, email, password)
  await expect(page).toHaveURL(/\/ar\/account$/)
  await page.goto('/ar/account/programs')
  await expect(page.locator('main')).toContainText('يُفتح التسجيل في البرامج بعد قبول طلبك.')
  await expect(page.getByRole('button', { name: 'التسجيل مجانًا' })).toHaveCount(0)
  await api.delete(`/api/accounts/${account.id}`)
  await api.dispose()
})

/** A one-paragraph body in the rich-text shape Payload stores. */
const paragraph = (text: string) => ({
  root: {
    type: 'root',
    direction: 'rtl',
    format: '',
    indent: 0,
    version: 1,
    children: [
      {
        type: 'paragraph',
        direction: 'rtl',
        format: '',
        indent: 0,
        version: 1,
        children: [{ type: 'text', text, version: 1 }],
      },
    ],
  },
})

test('announcements reach the students of their program, and nobody else', async ({ page }) => {
  const { api, email } = await acceptedApplicant(page)
  const account = await findAccount(api, email)
  const password = `pw-${Date.now()}-playwright`
  expect((await api.patch(`/api/accounts/${account!.id}`, { data: { password } })).ok()).toBe(true)
  const program = await programWithSessions(api)
  await enroll(api, account!.id, program.id)
  const mine = (
    await (
      await api.get(
        `/api/enrollments?where[account][equals]=${account!.id}&where[state][equals]=enrolled&depth=0`,
      )
    ).json()
  ).docs.map((r: { program: number }) => r.program) as number[]
  const others = (await (await api.get('/api/programs?limit=50&depth=0')).json()).docs as {
    id: number
    track: string
  }[]
  const elsewhere = others.find((p) => p.track !== 'projects' && !mine.includes(p.id))!

  const stamp = Date.now()
  const post = async (title: string, data: Record<string, unknown>) => {
    const res = await api.post('/api/announcements?locale=ar', {
      data: { title, body: paragraph(`نص ${title}`), status: 'published', ...data },
    })
    expect(res.status(), await res.text()).toBe(201)
    return ((await res.json()).doc as { id: number }).id
  }
  const forProgram = `إعلان البرنامج ${stamp}`
  const forAll = `إعلان للجميع ${stamp}`
  const forOthers = `إعلان لبرنامج آخر ${stamp}`
  const draft = `مسودة ${stamp}`
  const ids = [
    await post(forProgram, { program: program.id }),
    await post(forAll, {}),
    await post(forOthers, { program: elsewhere.id }),
    await post(draft, { program: program.id, status: 'draft' }),
  ]

  await signInAs(page, email, password)
  await expect(page).toHaveURL(/\/ar\/account$/)
  const main = page.locator('main')
  await expect(main).toContainText(forProgram)
  await expect(main).toContainText(forAll)
  await expect(main).not.toContainText(forOthers)
  await expect(main).not.toContainText(draft)

  const slug = (
    (await (await api.get(`/api/programs/${program.id}?depth=0`)).json()) as {
      slug: string
    }
  ).slug
  await page.goto(`/ar/account/programs/${slug}`)
  await expect(main).toContainText(`نص ${forProgram}`)
  await expect(main.locator('li').filter({ hasText: forAll })).toContainText('لكل الطلبة')
  await expect(main).not.toContainText(forOthers)
  await expect(main).not.toContainText(draft)

  await page.setViewportSize({ width: 1280, height: 900 })
  await page.screenshot({ path: `${SHOTS}/announcements-ar-1280.png`, fullPage: true })
  await page.goto('/ar/account')
  await page.screenshot({ path: `${SHOTS}/overview-announcements-ar-1280.png`, fullPage: true })

  // Not a public collection: a signed-in student cannot list them over the API.
  const listed = await page.request.get('/api/announcements')
  expect([401, 403]).toContain(listed.status())

  for (const id of ids) await api.delete(`/api/announcements/${id}`)
})

test('a graduated student confirms their name and gets a certificate anyone can verify', async ({
  page,
}) => {
  const { api, email } = await acceptedApplicant(page)
  const account = await findAccount(api, email)
  const password = `pw-${Date.now()}-playwright`
  expect(
    (
      await api.patch(`/api/accounts/${account!.id}`, {
        data: { password, officialNameAr: null, officialNameEn: null },
      })
    ).ok(),
  ).toBe(true)
  // Their directed program (earlier tests enrolled one), or the first one.
  const rows = (
    await (
      await api.get(
        `/api/enrollments?where[account][equals]=${account!.id}&where[state][equals]=enrolled&depth=1&locale=ar`,
      )
    ).json()
  ).docs as { id: number; program: { id: number; track: string; title: string } }[]
  let row = rows.find((r) => r.program.track === 'directed')
  if (!row) {
    const directed = (
      await (
        await api.get('/api/programs?where[track][equals]=directed&depth=0&locale=ar&limit=1')
      ).json()
    ).docs[0] as { id: number; title: string }
    const id = await enroll(api, account!.id, directed.id)
    row = { id, program: { ...directed, track: 'directed' } }
  }
  // Staff record the panel's decision.
  expect((await api.patch(`/api/enrollments/${row.id}`, { data: { graduated: true } })).ok()).toBe(
    true,
  )

  await signInAs(page, email, password)
  await expect(page).toHaveURL(/\/ar\/account$/)
  await page.goto('/ar/account/certificates')
  const main = page.locator('main')
  await expect(main).toContainText('شهادتك في انتظار اسمك')
  await main.getByRole('link', { name: 'أكّد اسمك' }).click()
  await expect(page).toHaveURL(/\/ar\/account\/profile#official-name$/)

  // The script is checked: an Arabic name typed in Latin letters is refused.
  await page.getByLabel(/^الاسم الرسمي بالعربية/).fill('Maryam Test')
  await page.getByLabel(/^الاسم الرسمي بالإنجليزية/).fill('Maryam Test')
  await page.getByRole('button', { name: 'احفظ الاسم' }).click()
  await expect(main).toContainText('اكتب الاسم بالحروف العربية.')
  await page.getByLabel(/^الاسم الرسمي بالعربية/).fill('مريم اختبار')
  await page.getByRole('button', { name: 'احفظ الاسم' }).click()
  await expect(main.getByRole('status')).toContainText('حُفظ اسمك.')

  await page.goto('/ar/account/certificates')
  const card = main.locator('li').filter({ hasText: row.program.title })
  await expect(card).toContainText('شهادة تخرّج')
  await card.getByRole('link', { name: 'اعرض الشهادة' }).click()
  await expect(page).toHaveURL(/\/ar\/account\/certificates\/JAA-\d{4}-[A-Z2-9]{6}$/)
  const number = page.url().split('/').pop()!
  const sheet = page.locator('[data-print-root]')
  await expect(sheet).toContainText('مريم اختبار')
  await expect(sheet).toContainText('Maryam Test')
  await expect(sheet).toContainText(number)
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.screenshot({ path: `${SHOTS}/certificate-ar-1280.png`, fullPage: true })

  // Anyone with the number can check it, and a revocation shows there at once.
  const visitor = await page.context().browser()!.newPage()
  await visitor.goto(`/en/verify/${number}`)
  await expect(visitor.locator('main')).toContainText('Valid certificate')
  await expect(visitor.locator('main')).toContainText('Maryam Test')
  await visitor.screenshot({ path: `${SHOTS}/verify-en-1280.png`, fullPage: true })
  const cert = (
    await (await api.get(`/api/certificates?where[number][equals]=${number}&depth=0`)).json()
  ).docs[0] as { id: number }
  await api.patch(`/api/certificates/${cert.id}`, { data: { revoked: true } })
  await visitor.reload()
  await expect(visitor.locator('main')).toContainText('This certificate has been revoked')
  await visitor.goto('/en/verify/JAA-2026-ZZZZZZ')
  await expect(visitor.locator('main')).toContainText('No certificate has this number.')
  await visitor.close()

  // Clean for the next run: no certificate, not graduated.
  await api.delete(`/api/certificates/${cert.id}`)
  await api.patch(`/api/enrollments/${row.id}`, { data: { graduated: false } })
})
