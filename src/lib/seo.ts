import type { Metadata } from 'next'
import { routing, type Locale } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site'

/** Canonical + hreflang alternates for a locale-prefixed path (path without locale, e.g. "/programs/x"). */
export function alternatesFor(locale: Locale, path: string): NonNullable<Metadata['alternates']> {
  const clean = path === '/' ? '' : path
  const languages: Record<string, string> = {}
  for (const l of routing.locales) languages[l] = `${SITE_URL}/${l}${clean}`
  languages['x-default'] = `${SITE_URL}/${routing.defaultLocale}${clean}`
  return { canonical: `${SITE_URL}/${locale}${clean}`, languages }
}

export function ogImageFor(
  title: string,
  subtitle?: string,
  locale: Locale = 'ar',
): NonNullable<Metadata['openGraph']>['images'] {
  const p = new URLSearchParams({ title, locale })
  if (subtitle) p.set('subtitle', subtitle)
  return [{ url: `${SITE_URL}/api/og?${p.toString()}`, width: 1200, height: 630, alt: title }]
}

/** Sitewide JSON-LD. `sameAs` is filled from SiteSettings socials when they exist. */
export function organizationJsonLd(
  locale: Locale,
  name: string,
  description: string,
  email: string,
  sameAs: string[] = [],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${SITE_URL}/#organization`,
    name,
    alternateName: locale === 'ar' ? 'Jil Altufan Academy' : 'أكاديمية جيل الطوفان',
    url: `${SITE_URL}/${locale}`,
    logo: `${SITE_URL}/brand/${locale === 'ar' ? 'logo' : 'logo-en'}.png`,
    description,
    email,
    ...(sameAs.length ? { sameAs } : {}),
  }
}

export function courseJsonLd(
  locale: Locale,
  p: {
    slug: string
    title: string
    description?: string | null
    providerName: string
    sessions?: { startsAt: string; durationMinutes?: number | null }[]
  },
) {
  const first = p.sessions?.[0]
  const last = p.sessions?.[p.sessions.length - 1]
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: p.title,
    description: p.description ?? undefined,
    url: `${SITE_URL}/${locale}/programs/${p.slug}`,
    inLanguage: locale,
    provider: {
      '@type': 'EducationalOrganization',
      '@id': `${SITE_URL}/#organization`,
      name: p.providerName,
    },
    ...(first && last
      ? {
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'online',
            courseWorkload: 'PT90M',
            startDate: first.startsAt,
            endDate: last.startsAt,
            location: { '@type': 'VirtualLocation', name: 'Zoom' },
          },
        }
      : {}),
  }
}

export function eventJsonLd(
  locale: Locale,
  e: {
    url: string
    name: string
    description?: string | null
    startDate: string
    endDate?: string | null
    online: boolean
    location?: string | null
    organizerName: string
  },
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.name,
    description: e.description ?? undefined,
    url: e.url,
    startDate: e.startDate,
    endDate: e.endDate ?? undefined,
    eventAttendanceMode: e.online
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: e.online
      ? { '@type': 'VirtualLocation', url: e.url }
      : { '@type': 'Place', name: e.location ?? '' },
    organizer: {
      '@type': 'EducationalOrganization',
      '@id': `${SITE_URL}/#organization`,
      name: e.organizerName,
    },
    inLanguage: locale,
  }
}
