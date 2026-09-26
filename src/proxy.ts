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
function csp(framable: boolean): string {
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
    // Payload's live preview frames the public page inside the admin, same origin — 'none'
    // blocked it («refused to connect» in the preview pane). The private pages stay 'none'.
    `frame-ancestors ${framable ? "'self'" : "'none'"}`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    'upgrade-insecure-requests',
  ].join('; ')
}

/**
 * The pages that belong to one person: the applicant's follow-up page, whose URL *is* the
 * secret, and the account window behind a sign-in (PLAN.md §13.3, §13.6). Next sets its own
 * Cache-Control on app-router responses and ignores one set in `next.config.ts`, so here is
 * the only place it holds — in production. `next dev` overrides it in turn, which is why
 * the strict value is asserted against a production server, never against dev.
 */
const PRIVATE_PATH = new RegExp(`^/(?:${routing.locales.join('|')})/(?:application|account)(?:/|$)`)

export default function proxy(req: NextRequest) {
  const res = intl(req) ?? NextResponse.next()
  const isPrivate = PRIVATE_PATH.test(req.nextUrl.pathname)
  res.headers.set('Content-Security-Policy', csp(!isPrivate))
  if (isPrivate) {
    res.headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate')
    // next-intl offers every page as three hreflang alternates. This one has no public
    // counterpart to offer — publishing the token in two more flavours is pointless.
    res.headers.delete('Link')
  }
  if (process.env.NODE_ENV === 'production')
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  return res
}

export const config = {
  // Everything except: Payload (/admin, /api — they set their own headers), the live-preview
  // entry (/preview), Next internals, media, files.
  matcher: '/((?!admin|api|preview|_next|_vercel|media|.*\\..*).*)',
}
