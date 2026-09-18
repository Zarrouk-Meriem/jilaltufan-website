/**
 * Every flag embedded in one stylesheet (public/flags, built by scripts/sync-flags.mjs
 * from country-flag-icons). Rendered by the server pages that show flags so it is in
 * the first HTML: one cached request, and no flag ever pops in after its row.
 */
export function FlagStyles() {
  // eslint-disable-next-line @next/next/no-css-tags -- a static file on purpose, see above
  return <link rel="stylesheet" precedence="default" href="/flags/flag-icons.css" />
}
