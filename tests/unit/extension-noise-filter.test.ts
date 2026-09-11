import { describe, expect, it } from 'vitest'
import { isExtensionError, isNoise } from '@/lib/dev/extension-noise-filter'

const report = (diff: string) => [
  "%s A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.",
  "- A server/client branch `if (typeof window !== 'undefined')`.",
  diff,
]

describe('extension noise filter', () => {
  it('drops a report whose only differing lines are bis_skin_checked (with text context lines)', () => {
    expect(
      isNoise(
        report(
          '    <div\n-                       bis_skin_checked="1"\n    >\n+                       بالعلم نتحرّر\n-                 bis_skin_checked="1"\n',
        ),
      ),
    ).toBe(true)
  })
  it('keeps a report with a different attribute', () => {
    expect(
      isNoise(report('    <div\n-                       data-foreign-mutation="1"\n    >\n')),
    ).toBe(false)
  })
  it('keeps a report mixing extension noise with a real attribute', () => {
    expect(
      isNoise(
        report(
          '-                       bis_skin_checked="1"\n-                       class="a"\n+                       class="b"\n',
        ),
      ),
    ).toBe(false)
  })
  it('keeps a report where a client-only tag appears', () => {
    expect(
      isNoise(
        report('-                       bis_skin_checked="1"\n+                       <span>\n'),
      ),
    ).toBe(false)
  })
  it('ignores non-hydration errors entirely', () => {
    expect(isNoise(['Failed to fetch'])).toBe(false)
  })
  it('does not treat the prose bullets as diff lines', () => {
    expect(isNoise(report(''))).toBe(false)
  })
})

describe('extension error filter', () => {
  const ext =
    "TypeError: Cannot read properties of undefined (reading 'M_ID')\n    at Y (chrome-extension://eppiocemhmnlbhjplcgkofciiegomcon/executors/200.js:1:761)\n    at E (chrome-extension://eppiocemhmnlbhjplcgkofciiegomcon/executors/200.js:1:1442)"
  const ours =
    'TypeError: boom\n    at Header (http://localhost:3001/_next/static/chunks/src_components_layout.js:12:5)'
  const mixed =
    'TypeError: boom\n    at Y (chrome-extension://abc/x.js:1:1)\n    at Header (http://localhost:3001/_next/static/chunks/app.js:12:5)'
  it('flags an error whose frames are all extension frames', () =>
    expect(isExtensionError({ stack: ext })).toBe(true))
  it('keeps an error from our own code', () =>
    expect(isExtensionError({ stack: ours })).toBe(false))
  it('keeps an error with even one frame of ours', () =>
    expect(isExtensionError({ stack: mixed })).toBe(false))
  it('keeps errors without a stack', () => expect(isExtensionError({ message: 'x' })).toBe(false))
  it('flags error events whose filename is an extension script', () =>
    expect(isExtensionError({ filename: 'chrome-extension://abc/content.js' })).toBe(true))
})
