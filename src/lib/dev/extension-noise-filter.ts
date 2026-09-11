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

const EXTENSION_FRAME = /(chrome|moz|safari-web)-extension:\/\//

/**
 * True when an error originates entirely inside a browser extension's injected
 * script: every stack frame is an extension URL (or, for `error` events, the
 * reported filename is one). An error with even one frame of ours is NOT noise.
 */
export function isExtensionError(input: {
  stack?: unknown
  message?: unknown
  filename?: unknown
}): boolean {
  if (typeof input.filename === 'string' && EXTENSION_FRAME.test(input.filename)) return true
  const stack = typeof input.stack === 'string' ? input.stack : ''
  const frames = stack.split('\n').filter((l) => /^\s*at\s|@/.test(l) && /:\d+/.test(l))
  if (!frames.length) return false
  return frames.every((f) => EXTENSION_FRAME.test(f))
}

/**
 * Dev only. Registered before Next's overlay listeners (instrumentation-client
 * runs first), so stopImmediatePropagation keeps extension-only failures out of
 * the overlay while everything else propagates untouched.
 */
export function installExtensionErrorFilter(): void {
  if (typeof window === 'undefined') return
  const w = window as Window & { __jaaExtErrorFilter?: boolean }
  if (w.__jaaExtErrorFilter) return
  w.__jaaExtErrorFilter = true
  window.addEventListener(
    'unhandledrejection',
    (e) => {
      const r = e.reason as { stack?: unknown; message?: unknown } | undefined
      if (r && typeof r === 'object' && isExtensionError(r)) {
        e.preventDefault()
        e.stopImmediatePropagation()
      }
    },
    true,
  )
  window.addEventListener(
    'error',
    (e) => {
      if (isExtensionError({ filename: e.filename, stack: e.error?.stack, message: e.message })) {
        e.preventDefault()
        e.stopImmediatePropagation()
      }
    },
    true,
  )
}
