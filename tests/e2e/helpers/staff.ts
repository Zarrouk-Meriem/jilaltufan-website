import { readFileSync } from 'node:fs'

/**
 * The throwaway staff credentials for the admin specs.
 *
 * `scripts/e2e-staff.ts` writes them to `.e2e-staff.json` (gitignored, local database only)
 * as well as printing them, and the specs read that file. Copying them into the environment
 * by hand is what drifted: a later run of the script rotates every password, and any shell
 * still holding the old ones fails half a suite with «invalid credentials» that look like a
 * bug in the code under test (2026-09-24). The environment still wins when it is set, for a
 * CI that would rather pass them in.
 */
export type StaffKey = 'ADMIN' | 'EDITOR' | 'ADMIN_B' | 'ADMIN_C' | 'EDITOR_B'
export type Credentials =
  { email: string; password: string } | { email: undefined; password: undefined }

let fromFile: Record<string, { email: string; password: string }> | null | undefined

function file(): Record<string, { email: string; password: string }> | null {
  if (fromFile !== undefined) return fromFile
  try {
    fromFile = JSON.parse(readFileSync('.e2e-staff.json', 'utf8')) as Record<
      string,
      { email: string; password: string }
    >
  } catch {
    fromFile = null
  }
  return fromFile
}

export function staffCredentials(key: StaffKey): Credentials {
  const email = process.env[`E2E_${key}_EMAIL`]
  const password = process.env[`E2E_${key}_PASSWORD`]
  if (email && password) return { email, password }
  const saved = file()?.[key]
  if (saved?.email && saved.password) return saved
  return { email: undefined, password: undefined }
}

export const staffConfigured = (...keys: StaffKey[]) =>
  keys.every((k) => !!staffCredentials(k).email && !!staffCredentials(k).password)
