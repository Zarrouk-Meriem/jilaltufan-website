import { cache } from 'react'
import type { Locale } from '@/i18n/routing'
import type { Event } from '@/payload-types'
import { getClient, publicBase } from './client'

const base = (locale: Locale) => ({ collection: 'events' as const, ...publicBase(locale) })

export const getCamp = cache(async (locale: Locale): Promise<Event | null> => {
  const payload = await getClient()
  const res = await payload.find({
    ...base(locale),
    where: { and: [{ type: { equals: 'camp' } }, { status: { equals: 'published' } }] },
    sort: '-startDate',
    limit: 1,
  })
  return res.docs[0] ?? null
})

export const listEvents = cache(async (locale: Locale): Promise<Event[]> => {
  const payload = await getClient()
  const res = await payload.find({
    ...base(locale),
    where: { status: { equals: 'published' } },
    sort: '-startDate',
    limit: 100,
  })
  return res.docs
})

export const getEventBySlug = cache(async (locale: Locale, slug: string): Promise<Event | null> => {
  const payload = await getClient()
  const res = await payload.find({
    ...base(locale),
    where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
  })
  return res.docs[0] ?? null
})

export const listEventSlugs = cache(async (): Promise<string[]> => {
  const payload = await getClient()
  const res = await payload.find({
    collection: 'events',
    where: { status: { equals: 'published' } },
    limit: 200,
    depth: 0,
    select: { slug: true },
    overrideAccess: false,
  })
  return res.docs.map((d) => d.slug)
})
