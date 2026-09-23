import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'
import { fileURLToPath } from 'url'
import { routing } from './src/i18n/routing'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// Security headers for the public site. The Payload admin gets a relaxed CSP
// (it relies on inline styles and, in dev, eval) — see the second entry.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

// The private routes on the public site: an applicant's follow-up page, found by the token
// in the URL, and the account window (PLAN.md §13.3, §13.6). A token in a URL and a signed-in
// page must not be cached by anything in front of us, and must not leave in a Referer header
// — neither has outbound links today, and `no-referrer` keeps that true if one is added.
const locales = routing.locales.join('|')
const privatePage = `/:locale(${locales})/:area(application|account)/:path*`
// Cache-Control is not here: Next sets its own on app-router pages and ignores this one,
// so `src/proxy.ts` sets it instead.
const privateHeaders = [
  ...securityHeaders.filter((h) => h.key !== 'Referrer-Policy'),
  { key: 'Referrer-Policy', value: 'no-referrer' },
]

const nextConfig: NextConfig = {
  output: process.env.DOCKER_BUILD ? 'standalone' : undefined,
  // `next dev` and `next start` both default to the same `.next/` output directory —
  // running a local production server for manual testing alongside the dev server (or
  // wiping `.next` for a dev restart) corrupts whichever one isn't currently rebuilding.
  // NEXT_DIST_DIR lets a local production check use its own directory instead.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // The OG image route reads its font files with fs at request time; serverless hosts
  // (Vercel) only bundle what static analysis can trace, so include them explicitly.
  outputFileTracingIncludes: {
    '/api/og': ['./src/app/(frontend)/api/og/fonts/**'],
  },
  // The apply form posts a CV (≤ 5 MB) through a server action; the default cap is 1 MB.
  experimental: { serverActions: { bodySizeLimit: '6mb' } },
  images: {
    formats: ['image/avif', 'image/webp'],
    localPatterns: [{ pathname: '/api/media/file/**' }, { pathname: '/brand/**' }],
  },
  async headers() {
    return [
      // The private route is excluded here and given its own rule below, so a key is never
      // set twice on one response.
      {
        source: `/((?!admin|api|(?:${locales})/(?:application|account)).*)`,
        headers: securityHeaders,
      },
      { source: privatePage, headers: privateHeaders },
      {
        source: '/admin/:path*',
        headers: securityHeaders.filter((h) => h.key !== 'X-Frame-Options'),
      },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
  turbopack: { root: path.resolve(dirname) },
}

export default withNextIntl(withPayload(nextConfig, { devBundleServerPackages: false }))
