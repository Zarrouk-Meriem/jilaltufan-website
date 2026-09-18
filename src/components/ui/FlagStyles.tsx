/**
 * The flag-icons stylesheet, a static copy in public/flags (scripts/sync-flags.mjs).
 * Rendered by the server pages that show flags so it is in the first HTML, not hoisted
 * after hydration (which is when flags would otherwise pop in).
 */
export function FlagStyles() {
  // eslint-disable-next-line @next/next/no-css-tags -- a static file on purpose, see above
  return <link rel="stylesheet" precedence="default" href="/flags/flag-icons.css" />
}
