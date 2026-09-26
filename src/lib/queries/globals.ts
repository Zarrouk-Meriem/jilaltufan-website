import { cache } from 'react'
import type { Locale } from '@/i18n/routing'
import { DEFAULT_TZ } from '@/lib/time'
import { getClient, previewRead, publicBase } from './client'

export const getSiteSettings = cache(async (locale: Locale) => {
  const payload = await getClient()
  const s = await payload.findGlobal({ slug: 'site-settings', ...publicBase(locale), depth: 0 })
  return {
    ...s,
    academyTimeZone: s.academyTimeZone || DEFAULT_TZ,
    joinLinkVisibility: s.joinLinkVisibility ?? 'window',
    joinWindowMinutes: s.joinWindowMinutes ?? 30,
  }
})

export const getHomePage = cache(async (locale: Locale) => {
  const payload = await getClient()
  return payload.findGlobal({
    slug: 'home-page',
    ...publicBase(locale),
    ...(await previewRead()),
  })
})

export const getAboutPage = cache(async (locale: Locale) => {
  const payload = await getClient()
  return payload.findGlobal({
    slug: 'about-page',
    ...publicBase(locale),
    ...(await previewRead()),
  })
})

export const getStudentsPage = cache(async (locale: Locale) => {
  const payload = await getClient()
  return payload.findGlobal({
    slug: 'students-page',
    ...publicBase(locale),
    depth: 0,
    ...(await previewRead()),
  })
})

export const getInstructorsPage = cache(async (locale: Locale) => {
  const payload = await getClient()
  return payload.findGlobal({
    slug: 'instructors-page',
    ...publicBase(locale),
    depth: 0,
    ...(await previewRead()),
  })
})

export const getNavigation = cache(async (locale: Locale) => {
  const payload = await getClient()
  return payload.findGlobal({ slug: 'navigation', ...publicBase(locale), depth: 0 })
})

export const getFooter = cache(async (locale: Locale) => {
  const payload = await getClient()
  return payload.findGlobal({ slug: 'footer', ...publicBase(locale), depth: 0 })
})
