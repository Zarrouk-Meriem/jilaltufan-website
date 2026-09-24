import type { IconName } from '@/components/icons/Icon'

/**
 * The icons a badge may wear: the site's own set (Icons8 «Stencil» drawn in-house), never
 * the academy's mark — the mark is not a small UI indicator (CLAUDE.md).
 */
export const BADGE_ICONS = [
  'award',
  'graduation',
  'target',
  'compass',
  'book',
  'calendar',
  'check-circle',
  'users',
  'globe',
  'quote',
] as const satisfies readonly IconName[]

export type BadgeIcon = (typeof BADGE_ICONS)[number]
