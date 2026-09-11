/**
 * Dev-only console filter for DOM-stamping browser extensions.
 *
 * Bitdefender TrafficLight adds bis_skin_checked="1" to every <div> before React
 * hydrates — including Next's own metadata wrapper, which no component of ours
 * can mark suppressHydrationWarning. React then logs a hydration report and the
 * Next dev overlay shows it. This drops that report ONLY when every differing
 * line is that attribute (React also prints stamped divs' text children as "+"
 * context lines; those are not attributes and are tolerated). Any real
 * mismatch — a different attribute, a tag, text that differs — still surfaces.
 *
 * Installed as an accessor so it stays outermost even after Next patches
 * console.error; the depth guard sends Next's own "call the original" back to
 * the native printer instead of re-entering (which would recurse forever).
 *
 * Guarded by tests/unit/extension-noise-filter.test.ts and tests/e2e/hydration.spec.ts.
 */
export const isNoiseSource = String.raw`
function isNoise(args) {
  var s = Array.prototype.map.call(args, function (a) { return typeof a === 'string' ? a : '' }).join('\n')
  if (!/hydrat/i.test(s)) return false
  var d = s.split('\n').filter(function (l) { return /^[+-]\s{2,}/.test(l) })
  if (!d.length) return false
  return d.every(function (l) {
    if (/bis_skin_checked=/.test(l)) return true
    return l.charAt(0) === '+' && !/^\+\s+(<|[\w-]+=)/.test(l)
  })
}`

export const EXTENSION_NOISE_FILTER = String.raw`(function () {
  var native = console.error
  var inner = native
  var depth = 0
  ${isNoiseSource}
  function filtered() {
    if (depth > 0) return native.apply(console, arguments)
    if (isNoise(arguments)) return
    depth++
    try { return inner.apply(console, arguments) } finally { depth-- }
  }
  Object.defineProperty(console, 'error', {
    configurable: true,
    enumerable: true,
    get: function () { return filtered },
    set: function (f) { inner = typeof f === 'function' ? f : native },
  })
})();`
