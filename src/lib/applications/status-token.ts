import { randomBytes } from 'node:crypto'
import { SITE_URL } from '@/lib/site'

/**
 * The link an applicant gets in the confirmation letter, so they can see where their
 * application stands without an account (PLAN.md §13.3). The token is the only secret:
 * whoever holds it sees that one application's status and nothing else — no documents,
 * no notes, no other applicant.
 *
 * It is long enough that guessing is hopeless (24 random bytes = 192 bits), opaque (it
 * carries no application id), and stored on the row rather than signed, so a token can be
 * replaced by writing a new one — which is what an expired link does to itself.
 */
const TOKEN_BYTES = 24

/**
 * 90 days. The academy answers within two weeks, and an accepted applicant moves to a real
 * account; this only has to outlive the decision, with room for a slow season. An expired
 * link is not a dead end: the page offers to send a fresh one to the address on the
 * application, which is the only address it can reach.
 */
export const STATUS_TOKEN_DAYS = 90

export type StatusToken = { statusToken: string; statusTokenExpiresAt: string }

/** A new token and its expiry, ready to write onto an application row. */
export function mintStatusToken(now: Date = new Date()): StatusToken {
  return {
    statusToken: randomBytes(TOKEN_BYTES).toString('base64url'),
    statusTokenExpiresAt: new Date(
      now.getTime() + STATUS_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString(),
  }
}

/** Past its expiry — or missing one, which a row from before this feature would be. */
export function statusTokenExpired(expiresAt?: string | null, now: Date = new Date()): boolean {
  if (!expiresAt) return true
  const at = Date.parse(expiresAt)
  return Number.isNaN(at) || at <= now.getTime()
}

/** The absolute link that goes in the letter; the applicant's own language. */
export function statusUrl(token: string, locale: 'ar' | 'en'): string {
  return `${SITE_URL}/${locale}/application/${encodeURIComponent(token)}`
}
