/**
 * Live preview: the admin's pane loads `/preview?path=…`, which turns on draft mode for staff
 * and goes to the page (src/app/preview/route.ts).
 */

/** A page of this site in one of its locales — never `//host`, a backslash, or a space. */
export const isSitePath = (path: string) =>
  /^\/(ar|en)(\/[^\s\\]*)?(\?[^\s\\]*)?$/.test(path) && !path.includes('//')

/**
 * The preview entry for a page, on the origin the admin itself is open at: the pane is an
 * iframe and needs the admin's sign-in cookie, which a different host (the Vercel address
 * against the domain, or another dev port) would not receive.
 */
export function previewURL(path: string, req: { headers: Headers }) {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  const proto =
    req.headers.get('x-forwarded-proto') ??
    (host && /^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? 'http' : 'https')
  const origin = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL ?? '')
  return `${origin}/preview?path=${encodeURIComponent(path)}`
}
