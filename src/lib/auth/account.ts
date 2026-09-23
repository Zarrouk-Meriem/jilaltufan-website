import { headers as nextHeaders } from 'next/headers'
import { cache } from 'react'
import { getClient } from '@/lib/queries/client'
import type { Account } from '@/payload-types'

/**
 * The signed-in account, or null. Read from the request's own cookie through Payload, so a
 * forged or expired token is simply nobody.
 *
 * Staff are deliberately not accounts: Payload names one cookie for every auth collection
 * (`${cookiePrefix}-token`), so a staff token arrives here too — this returns null for it
 * rather than letting a staff session wander into a student's window. That single shared
 * cookie is also why signing into an account signs a staff member out of `/admin` in the
 * same browser, and the reverse.
 */
export const getAccount = cache(async (): Promise<Account | null> => {
  const payload = await getClient()
  const { user } = await payload.auth({ headers: await nextHeaders() })
  if (!user || user.collection !== 'accounts') return null
  return user as unknown as Account
})

/** The cookie name Payload reads on the way back in — one for every auth collection. */
export async function authCookieName(): Promise<string> {
  const payload = await getClient()
  return `${payload.config.cookiePrefix ?? 'payload'}-token`
}
