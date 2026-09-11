/** Payload relations arrive as id or populated doc depending on depth; normalise. */
export function rel<T extends { id: number | string }>(
  v: T | number | string | null | undefined,
): T | null {
  return v && typeof v === 'object' ? v : null
}
export function rels<T extends { id: number | string }>(
  v: (T | number | string)[] | null | undefined,
): T[] {
  return (v ?? []).map(rel).filter((x): x is T => x !== null)
}
