/**
 * Throwaway staff accounts for the admin e2e specs (`tests/e2e/activity.spec.ts`), in the
 * local database only. Prints the credentials as shell exports; the specs skip without them.
 *   pnpm payload:tsx run scripts/e2e-staff.ts            → create (or reset) and print
 *   pnpm payload:tsx run scripts/e2e-staff.ts delete     → remove them and their log rows
 */
import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import config from '@payload-config'
import { getPayload } from 'payload'

const ACCOUNTS = [
  { key: 'ADMIN', email: 'e2e-admin@example.test', role: 'admin' as const },
  { key: 'EDITOR', email: 'e2e-editor@example.test', role: 'editor' as const },
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
