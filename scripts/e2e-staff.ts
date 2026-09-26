/**
 * Throwaway staff accounts for the admin e2e specs, in the local database only. Prints the
 * credentials as shell exports; the specs skip without them.
 *   pnpm payload:tsx run scripts/e2e-staff.ts            → create (or reset) and print
 *   pnpm payload:tsx run scripts/e2e-staff.ts delete     → remove them and their log rows
 *
 * They are also written to `.e2e-staff.json` (gitignored), which the specs read. Every run
 * rotates every password, so a shell still exporting an older set fails half a suite with
 * «invalid credentials»; the file is always the current one.
 *
 * One admin per spec file that needs one, rather than one shared between them: Payload
 * loses a session when two logins for the same account land at the same moment (see the
 * note at the top of `activity.spec.ts`), and spec *files* run in parallel workers, so a
 * shared admin had one spec signing the other out mid-test (2026-09-23).
 */
import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import { rmSync, writeFileSync } from 'node:fs'
import config from '@payload-config'
import { getPayload } from 'payload'

const ACCOUNTS = [
  // activity.spec.ts
  { key: 'ADMIN', email: 'e2e-admin@example.test', role: 'admin' as const },
  { key: 'EDITOR', email: 'e2e-editor@example.test', role: 'editor' as const },
  // application-status.spec.ts
  { key: 'ADMIN_B', email: 'e2e-admin-b@example.test', role: 'admin' as const },
  // account.spec.ts
  { key: 'ADMIN_C', email: 'e2e-admin-c@example.test', role: 'admin' as const },
  // live-preview.spec.ts — an editor, the person who edits the pages
  { key: 'EDITOR_B', email: 'e2e-editor-b@example.test', role: 'editor' as const },
]

const payload = await getPayload({ config })
const mode = process.argv[2] === 'delete' ? 'delete' : 'create'

const saved: Record<string, { email: string; password: string }> = {}

for (const account of ACCOUNTS) {
  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { equals: account.email } },
    overrideAccess: true,
    limit: 1,
  })
  if (mode === 'delete') {
    if (docs[0]) await payload.delete({ collection: 'users', id: docs[0].id, overrideAccess: true })
    await payload.delete({
      collection: 'activity',
      where: { userEmail: { equals: account.email } },
      overrideAccess: true,
    })
    console.log(`removed ${account.email}`)
    continue
  }
  const password = randomBytes(12).toString('base64url')
  const data = { email: account.email, password, role: account.role, name: `e2e ${account.role}` }
  if (docs[0])
    await payload.update({ collection: 'users', id: docs[0].id, data, overrideAccess: true })
  else await payload.create({ collection: 'users', data, overrideAccess: true })
  // Resetting a password must also clear a lock, or the script hands out credentials that
  // Payload then refuses: a run with stale credentials locks the account after ten attempts,
  // and the next run's fresh password cannot get in either (2026-09-24).
  // `unlock` is typed with the login shape and only uses the address; the password it has
  // just been given is the one written above.
  await payload.unlock({
    collection: 'users',
    data: { email: account.email, password },
    overrideAccess: true,
  })
  saved[account.key] = { email: account.email, password }
  console.log(`export E2E_${account.key}_EMAIL=${account.email}`)
  console.log(`export E2E_${account.key}_PASSWORD=${password}`)
}

if (mode === 'delete') rmSync('.e2e-staff.json', { force: true })
else writeFileSync('.e2e-staff.json', `${JSON.stringify(saved, null, 2)}\n`)
process.exit(0)
