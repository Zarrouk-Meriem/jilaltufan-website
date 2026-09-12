export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
)
export const SITE_DOMAIN = 'jilaltufan.org'
export const STYLEGUIDE_ENABLED =
  process.env.NODE_ENV !== 'production' || process.env.ENABLE_STYLEGUIDE === '1'
