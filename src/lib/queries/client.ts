import config from '@payload-config'
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
