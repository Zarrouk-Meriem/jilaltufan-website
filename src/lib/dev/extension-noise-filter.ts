/**
 * Dev-only console filter for DOM-stamping browser extensions.
 *
 * Bitdefender TrafficLight adds bis_skin_checked="1" to every <div> before React
 * hydrates — including Next's own metadata wrapper, which no component of ours
 * can mark suppressHydrationWarning. React then logs a hydration report and the
 * Next dev overlay shows it. `isNoise` is true ONLY when every differing line is
 * that attribute (React also prints stamped divs' text children as "+" context
 * lines; those are tolerated). Any real mismatch — another attribute, a tag, a
 * text difference — still surfaces.
 *
 * Installed from src/instrumentation-client.ts (runs before hydration, is not a
 * React element, so nothing is rendered). The accessor keeps the filter
 * outermost whichever order Next's own console patch lands in; the depth guard
 * sends Next's "call the original" back to the native printer instead of
 * re-entering (a naive accessor recursed and crashed the tab).
 *
 * Guarded by tests/unit/extension-noise-filter.test.ts and tests/e2e/hydration.spec.ts.
 */
const DIFF_LINE = /^[+-]\s{2,}/
const CLIENT_ATTR_OR_TAG = /^\+\s+(<|[\w-]+=)/

export function isNoise(args: ArrayLike<unknown>): boolean {
  const s = Array.from(args, (a) => (typeof a === 'string' ? a : '')).join('\n')
  if (!/hydrat/i.test(s)) return false
  const diff = s.split('\n').filter((l) => DIFF_LINE.test(l))
  if (!diff.length) return false
  return diff.every(
    (l) => /bis_skin_checked=/.test(l) || (l.startsWith('+') && !CLIENT_ATTR_OR_TAG.test(l)),
  )
}

export function installExtensionNoiseFilter(): void {
  if (typeof console === 'undefined') return
  const c = console as Console & { __jaaNoiseFilter?: boolean }
  if (c.__jaaNoiseFilter) return
  c.__jaaNoiseFilter = true
  console.log('[jaa] extension noise filter installed')
  const native = console.error
  let inner: typeof console.error = native
  let depth = 0
  function filtered(this: unknown, ...args: unknown[]) {
    if (depth > 0) return native.apply(console, args)
    if (isNoise(args)) return
    depth++
    try {
      return inner.apply(console, args)
    } finally {
      depth--
    }
  }
  Object.defineProperty(console, 'error', {
    configurable: true,
    enumerable: true,
    get: () => filtered,
    set: (f: unknown) => {
      inner = typeof f === 'function' ? (f as typeof console.error) : native
    },
  })
}
