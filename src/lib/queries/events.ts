import { cache } from 'react'
import type { Locale } from '@/i18n/routing'
import type { Event } from '@/payload-types'
import { getClient, publicBase } from './client'

export const getCamp = cache(async (locale: Locale): Promise<Event | null> => {
  const payload = await getClient()
  const res = await payload.find({
    collection: 'events',
    ...publicBase(locale),
    where: { and: [{ type: { equals: 'camp' } }, { status: { equals: 'published' } }] },
    sort: '-startDate',
    limit: 1,
  })
  return res.docs[0] ?? null
})
