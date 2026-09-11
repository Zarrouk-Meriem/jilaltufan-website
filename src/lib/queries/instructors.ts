import { cache } from 'react'
import type { Locale } from '@/i18n/routing'
import type { Instructor } from '@/payload-types'
import { getClient, publicBase } from './client'

export const listInstructors = cache(async (locale: Locale, limit = 50): Promise<Instructor[]> => {
  const payload = await getClient()
  const res = await payload.find({
    collection: 'instructors',
    ...publicBase(locale),
    where: { status: { equals: 'published' } },
    sort: 'name',
    limit,
  })
  return res.docs
})
