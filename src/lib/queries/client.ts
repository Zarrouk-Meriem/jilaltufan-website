import config from '@payload-config'
import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { cache } from 'react'
import { hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { routing, type Locale } from '@/i18n/routing'

/** One Payload instance per request. Pages never import `payload` directly. */
export const getClient = cache(async () => getPayload({ config }))

export type Q = { locale: Locale }

/**
 * Public reads always carry the locale, the Arabic fallback, and the published filter.
 * The locale is validated here because a page can start rendering (and querying)
 * before its layout's notFound() for e.g. /favicon.ico resolves.
 */
export const publicBase = (locale: Locale) => ({
  ...(hasLocale(routing.locales, locale) ? {} : notFound()),
  locale,
  fallbackLocale: 'ar' as const,
  overrideAccess: false,
  depth: 1,
})

/**
 * Draft mode is on only in a staff browser that came through `/preview` (the admin's
 * live-preview pane): there the page globals read their latest autosaved draft, and every
 * visitor keeps reading what was published.
 */
export const isPreview = cache(async () => (await draftMode()).isEnabled)

/**
 * In preview, a page global reads its latest draft. Drafts are versions, which the public
 * read access does not open, so the read runs with full access — the staff check already
 * happened at `/preview`, and these globals hold nothing private.
 */
export const previewRead = async () =>
  (await isPreview()) ? { draft: true, overrideAccess: true } : {}
