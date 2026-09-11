import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './i18n/routing'

const intl = createMiddleware(routing)

/**
 * Content-Security-Policy. No nonce on purpose: the public pages are ISR/SSG,
 * so a per-request nonce could never match the one baked into cached HTML
 * (Lighthouse caught the mismatch in M7). 'self' still pins scripts to our
 * origin; inline is allowed for Next's own bootstrap scripts. Reintroduce a
 * nonce only if every page becomes dynamically rendered. Dev keeps
 * 'unsafe-eval' for React Refresh; Turnstile's domain is allowed only when on.
 */
function csp(): string {
  const dev = process.env.NODE_ENV !== 'production'
  const turnstile = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    ? ' https://challenges.cloudflare.com'
    : ''
  return [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}${turnstile}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self' data:`,
    `connect-src 'self'${dev ? ' ws: wss:' : ''}${turnstile}`,
    `frame-src${turnstile || " 'none'"}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    'upgrade-insecure-requests',
  ].join('; ')
}

export default function proxy(req: NextRequest) {
  const res = intl(req) ?? NextResponse.next()
  res.headers.set('Content-Security-Policy', csp())
  if (process.env.NODE_ENV === 'production')
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  return res
}

export const config = {
  // Everything except: Payload (/admin, /api — they set their own headers), Next internals, media, files.
  matcher: '/((?!admin|api|_next|_vercel|media|.*\\..*).*)',
}
