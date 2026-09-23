/**
 * Throwaway staff accounts for the admin e2e specs, in the local database only. Prints the
 * credentials as shell exports; the specs skip without them.
 *   pnpm payload:tsx run scripts/e2e-staff.ts            → create (or reset) and print
 *   pnpm payload:tsx run scripts/e2e-staff.ts delete     → remove them and their log rows
 *
 * One admin per spec file that needs one, rather than one shared between them: Payload
 * loses a session when two logins for the same account land at the same moment (see the
 * note at the top of `activity.spec.ts`), and spec *files* run in parallel workers, so a
 * shared admin had one spec signing the other out mid-test (2026-09-23).
 */
import 'dotenv/config'
import { randomBytes } from 'node:crypto'
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
]

const payload = await getPayload({ config })
const mode = process.argv[2] === 'delete' ? 'delete' : 'create'

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
  console.log(`export E2E_${account.key}_EMAIL=${account.email}`)
  console.log(`export E2E_${account.key}_PASSWORD=${password}`)
}
process.exit(0)
