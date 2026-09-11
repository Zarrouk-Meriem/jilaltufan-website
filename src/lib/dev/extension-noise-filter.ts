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
// A client-only line that is a tag, an attribute, or a style entry (key: value) is a real difference;
// anything else on a '+' line is text React prints as context under a stamped element.
const CLIENT_ATTR_OR_TAG = /^\+\s+(<|[\w-]+=|[\w-]+: )/
/**
 * Attributes written into the DOM by Bitdefender's desktop browser integration
 * (not an extension — it cannot be loaded into a test browser, only simulated):
 * bis_skin_checked, bis_size (JSON), bis_id, bis_register, __processed_<hash>__.
 */
export const STAMPED_ATTR =
  /^-\s+(bis_skin_checked|bis_size|bis_id|bis_register|__processed_[\w-]+__|data-darkreader-[\w-]*|data-locator-[\w-]*)=|^-\s+[\w-]+="(chrome|moz|safari-web)-extension:\/\//

export function isNoise(args: ArrayLike<unknown>): boolean {
  const s = Array.from(args, (a) => (typeof a === 'string' ? a : '')).join('\n')
  if (!/hydrat/i.test(s)) return false
  const diff = s.split('\n').filter((l) => DIFF_LINE.test(l))
  if (!diff.length) return false
  return unmatchedLines(args).length === 0
}

/**
 * Dark Reader rewrites inline styles, so React prints the whole style object of
 * an element as +/- pairs even where values are equal in effect (48 vs "48px").
 * A pair is noise when both sides normalise to the same value.
 */
const STYLE_ENTRY = /^([+-])\s+([\w-]+):\s+(.+)$/
const normaliseStyleValue = (v: string) =>
  v
    .trim()
    .replace(/^"(.*)"$/, '$1')
    .replace(/^(-?\d+(?:\.\d+)?)px$/, '$1')

function styleNoiseLines(diff: string[]): Set<string> {
  const noise = new Set<string>()
  const entries = diff
    .map((l) => ({ l, m: STYLE_ENTRY.exec(l) }))
    .filter((e): e is { l: string; m: RegExpExecArray } => !!e.m && !/=/.test(e.m[2]!))
  for (let i = 0; i < entries.length; i++) {
    const a = entries[i]!
    if (a.m[2]!.startsWith('--darkreader-')) {
      noise.add(a.l)
      continue
    }
    const b = entries[i + 1]
    // React prints the client value (+) and the server value (-) as adjacent lines for one key.
    if (
      b &&
      b.m[2] === a.m[2] &&
      b.m[1] !== a.m[1] &&
      normaliseStyleValue(a.m[3]!) === normaliseStyleValue(b.m[3]!)
    ) {
      noise.add(a.l)
      noise.add(b.l)
      i++
    }
  }
  return noise
}

const DARKREADER_ATTR = /^-\s+(data-darkreader-[\w-]*=|style=\{\{--darkreader-)/

/** The differing lines that stopped a report from classifying as noise (for diagnosis). */
export function unmatchedLines(args: ArrayLike<unknown>): string[] {
  const s = Array.from(args, (a) => (typeof a === 'string' ? a : '')).join('\n')
  const diff = s.split('\n').filter((l) => DIFF_LINE.test(l))
  const styleNoise = styleNoiseLines(diff)
  return diff
    .filter(
      (l) =>
        !(
          STAMPED_ATTR.test(l) ||
          DARKREADER_ATTR.test(l) ||
          styleNoise.has(l) ||
          (l.startsWith('+') && !CLIENT_ATTR_OR_TAG.test(l))
        ),
    )
    .map((l) => l.trim())
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
    // A hydration report that mentions Bitdefender's attributes but still has other
    // differing lines: print just those lines so the classifier can be fixed from a
    // screenshot instead of guesswork.
    if (/hydrat/i.test(String(args[0]))) {
      const lines = unmatchedLines(args)
      if (lines.length)
        console.warn(
          '[jaa] hydration report NOT filtered — unmatched diff lines:\n' +
            lines.slice(0, 12).join('\n'),
        )
    }
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
