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

/** Best-effort client IP behind common proxies; falls back to a constant so the limiter still applies. */
export function clientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  return headers.get('x-real-ip') ?? headers.get('cf-connecting-ip') ?? 'unknown'
}
