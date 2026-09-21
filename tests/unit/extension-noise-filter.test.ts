import { describe, expect, it } from 'vitest'
import { isExtensionError, isNoise, unmatchedLines } from '@/lib/dev/extension-noise-filter'

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

describe('Bitdefender attribute family', () => {
  it('drops reports with bis_size / bis_id / __processed__ lines', () => {
    const diff = [
      '-        bis_skin_checked="1"',
      '-        bis_size="{&quot;x&quot;:0,&quot;y&quot;:0}"',
      '-        bis_id="abc123"',
      '-        __processed_9f8e7d__="true"',
    ].join('\n')
    expect(isNoise(report(diff))).toBe(true)
  })
  it('reports exactly which lines are unmatched', () => {
    const diff = ['-        bis_skin_checked="1"', '-        data-foo="1"', '+        <span>'].join(
      '\n',
    )
    expect(unmatchedLines(report(diff))).toEqual(['-        data-foo="1"', '+        <span>'])
  })
})

describe('Dark Reader', () => {
  const captured = [
    '-                             data-darkreader-scheme="dark"',
    '-                             data-darkreader-proxy-injected="true"',
    '+                                                   color: "transparent"',
    '-                                                   color: "transparent"',
    '+                                                   height: 48',
    '-                                                   height: "48px"',
    '+                                                   width: "auto"',
    '-                                                   width: "auto"',
    '-                                                   --darkreader-inline-color: "transparent"',
    '-                                                 data-darkreader-inline-color=""',
    '-                                               data-darkreader-inline-stroke=""',
    '-                                               style={{--darkreader-inline-stroke:"currentColor"}}',
  ].join('\n')
  it('drops the report captured from the real extension', () => {
    expect(isNoise(report(captured))).toBe(true)
  })
  it('drops a mixed Bitdefender + Dark Reader report', () => {
    expect(isNoise(report('-        bis_skin_checked="1"\n' + captured))).toBe(true)
  })
  it('keeps a real style difference', () => {
    expect(
      isNoise(report(captured + '\n+                height: 48\n-                height: "64px"')),
    ).toBe(false)
  })
  it('keeps a real attribute next to Dark Reader noise', () => {
    expect(unmatchedLines(report(captured + '\n-        class="a"'))).toEqual([
      '-        class="a"'.trim(),
    ])
  })
})

describe('captured from the real profile: two logos + LocatorJS + Bitdefender uuid', () => {
  const captured = [
    '-                             data-locator-client-url="chrome-extension://npbfdllefekhdplbkdigpncggmojpefi/client.bund..."',
    '-                             data-darkreader-mode="dynamic"',
    '-                               __processed_69bb2573-db79-47f6-8d68-42d5bfa7d82a__="true"',
    '+                                                     height: 48',
    '-                                                     height: "48px"',
    '+                                                     width: "auto"',
    '-                                                     width: "auto"',
    '+                                                     height: 34',
    '-                                                     height: "34px"',
    '+                                                 height: 44',
    '-                                                 height: "44px"',
    '-                                                 data-darkreader-inline-stroke=""',
  ].join('\n')
  it('is all noise', () => expect(unmatchedLines(report(captured))).toEqual([]))
  it('a genuinely different height still surfaces', () => {
    const real = captured + '\n+                height: 48\n-                height: "64px"'
    expect(unmatchedLines(report(real))).toEqual([
      '+                height: 48'.trim(),
      '-                height: "64px"'.trim(),
    ])
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

describe('Dark Reader on a next/image `fill` element (captured 2026-09-21, home hero)', () => {
  // React prints the whole style object once the attribute was rewritten; `fill`
  // passes objectFit/objectPosition as undefined, which have no server line at all.
  const captured = [
    '+                             position: "absolute"',
    '-                             position: "absolute"',
    '+                             left: 0',
    '-                             left: "0px"',
    '+                             objectFit: undefined',
    '+                             objectPosition: undefined',
    '+                             color: "transparent"',
    '-                             color: "transparent"',
    '-                             --darkreader-inline-color: "transparent"',
    '-                           data-darkreader-inline-color=""',
    '-                                     style={{--darkreader-inline-stroke:"currentColor"}}',
  ].join('\n')
  it('is all noise', () => expect(unmatchedLines(report(captured))).toEqual([]))
  it('drops the report', () => expect(isNoise(report(captured))).toBe(true))
  it('a client-only style with a real value still surfaces', () => {
    const real = captured.replace('objectFit: undefined', 'objectFit: "cover"')
    expect(unmatchedLines(report(real)).map((l) => l.replace(/\s+/g, ' '))).toEqual([
      '+ objectFit: "cover"',
    ])
  })
})
