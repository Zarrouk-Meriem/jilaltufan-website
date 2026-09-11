/**
 * Accent-word markup for display headings: `**word**` → red accent.
 * Editors write `بالعلم **نتحرّر**`; we render the starred segment with the
 * accent class. Only the first pair is honoured — one red gesture per heading.
 */
export type AccentSegment = { text: string; accent: boolean }

export function parseAccent(input: string): AccentSegment[] {
  const m = /\*\*(.+?)\*\*/.exec(input)
  if (!m || m.index === undefined) return [{ text: input.replaceAll('**', ''), accent: false }]
  const before = input.slice(0, m.index)
  const after = input.slice(m.index + m[0].length).replaceAll('**', '')
  const out: AccentSegment[] = []
  if (before) out.push({ text: before, accent: false })
  out.push({ text: m[1] ?? '', accent: true })
  if (after) out.push({ text: after, accent: false })
  return out
}

export function stripAccent(input: string): string {
  return input.replaceAll('**', '')
}
