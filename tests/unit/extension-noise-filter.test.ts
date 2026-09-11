import { describe, expect, it } from 'vitest'
import { isNoise } from '@/lib/dev/extension-noise-filter'

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
