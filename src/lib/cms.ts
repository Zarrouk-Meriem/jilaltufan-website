/**
 * CMS-first, messages-second. Editors own the globals; while a field is empty the
 * built-in copy from messages/*.json shows, so a half-filled admin never leaves a hole.
 */
export function textOr(value: string | null | undefined, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback
}

export function listOr<T>(items: T[] | null | undefined, fallback: T[]): T[] {
  return items && items.length ? items : fallback
}
