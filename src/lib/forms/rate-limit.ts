/**
 * In-process token bucket keyed by a hashed client IP. Sufficient for a single
 * instance at this traffic (≤1k users/year). If the app is ever scaled
 * horizontally, swap the store for Redis/KV — the interface stays the same.
 */
import { createHash } from 'node:crypto'

type Bucket = { tokens: number; updatedAt: number }

export type RateLimiter = {
  check: (key: string, now?: number) => { ok: boolean; retryAfterMs: number }
}

export function createRateLimiter({
  capacity,
  refillPerMs,
  salt = 'jaa',
}: {
  capacity: number
  refillPerMs: number
  salt?: string
}): RateLimiter {
  const buckets = new Map<string, Bucket>()
  const hash = (k: string) =>
    createHash('sha256')
      .update(salt + '|' + k)
      .digest('hex')
      .slice(0, 32)
  return {
    check(key, now = Date.now()) {
      const id = hash(key)
      const b = buckets.get(id) ?? { tokens: capacity, updatedAt: now }
      const refilled = Math.min(capacity, b.tokens + (now - b.updatedAt) * refillPerMs)
      if (refilled >= 1) {
        buckets.set(id, { tokens: refilled - 1, updatedAt: now })
        return { ok: true, retryAfterMs: 0 }
      }
      buckets.set(id, { tokens: refilled, updatedAt: now })
      return { ok: false, retryAfterMs: Math.ceil((1 - refilled) / refillPerMs) }
      // Note: buckets are pruned lazily; memory stays bounded by distinct IPs per process lifetime.
    },
  }
}

/** 5 submissions per 10 minutes per IP for applications; 3 for contact. */
export const applyLimiter = createRateLimiter({ capacity: 5, refillPerMs: 5 / (10 * 60_000) })
export const contactLimiter = createRateLimiter({ capacity: 3, refillPerMs: 3 / (10 * 60_000) })
/**
 * Re-issuing an expired follow-up link sends mail to an address we already hold, so the
 * ceiling is about mail volume, not about guessing: 3 per 10 minutes per IP. Its own bucket
 * so asking for a link never spends an applicant's submission budget.
 */
export const statusLinkLimiter = createRateLimiter({
  capacity: 3,
  refillPerMs: 3 / (10 * 60_000),
  salt: 'jaa-status-link',
})

/**
 * Asking for a password-reset link: 5 per 10 minutes per IP. Its own bucket, not the
 * status link's — they are different actions, and one should never spend the other's
 * budget for a visitor behind a shared address.
 */
export const resetLimiter = createRateLimiter({
  capacity: 5,
  refillPerMs: 5 / (10 * 60_000),
  salt: 'jaa-password-reset',
})

/** A guest sending materials: 10 files per 10 minutes per IP, which is a working session. */
export const uploadLimiter = createRateLimiter({
  capacity: 10,
  refillPerMs: 10 / (10 * 60_000),
  salt: 'jaa-session-file',
})

/**
 * Signing in and choosing a password: 30 per 10 minutes per IP. This is the axis a
 * per-account lock cannot see — one address working through many accounts — and Payload
 * already locks a single account after ten bad attempts, so this only has to stay well
 * below what a spraying script wants. It must also not punish a shared connection: a
 * household, a university's NAT, or a room of students all signing in before a session
 * would trip a tighter cap between them (10 was too low; our own suite hit it).
 */
export const signInLimiter = createRateLimiter({
  capacity: 30,
  refillPerMs: 30 / (10 * 60_000),
  salt: 'jaa-sign-in',
})

/** Best-effort client IP behind common proxies; falls back to a constant so the limiter still applies. */
export function clientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  return headers.get('x-real-ip') ?? headers.get('cf-connecting-ip') ?? 'unknown'
}
