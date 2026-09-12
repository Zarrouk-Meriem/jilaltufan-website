export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
)
export const SITE_DOMAIN = 'jilaltufan.org'
export const STYLEGUIDE_ENABLED =
  process.env.NODE_ENV !== 'production' || process.env.ENABLE_STYLEGUIDE === '1'

/**
 * Preview deployments (a *.vercel.app URL before the real domain exists) must never be
 * indexed — Google would otherwise rank the throwaway host over jilaltufan.org later.
 * Set SITE_NOINDEX=1 on such a deployment; robots.txt and every page's robots meta obey it.
 */
export const SITE_NOINDEX = process.env.SITE_NOINDEX === '1' || process.env.SITE_NOINDEX === 'true'
