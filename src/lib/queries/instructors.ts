import { cache } from 'react'
import type { Locale } from '@/i18n/routing'
import type { Instructor } from '@/payload-types'
import { getClient, publicBase } from './client'

const base = (locale: Locale) => ({ collection: 'instructors' as const, ...publicBase(locale) })

export const listInstructors = cache(async (locale: Locale, limit = 50): Promise<Instructor[]> => {
  const payload = await getClient()
  const res = await payload.find({
    ...base(locale),
    where: { status: { equals: 'published' } },
    sort: 'name',
    limit,
  })
  return res.docs
})

export const getInstructorBySlug = cache(
  async (locale: Locale, slug: string): Promise<Instructor | null> => {
    const payload = await getClient()
    const res = await payload.find({
      ...base(locale),
      where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
      limit: 1,
      depth: 2,
    })
    return res.docs[0] ?? null
  },
)

export const listInstructorSlugs = cache(async (): Promise<string[]> => {
  const payload = await getClient()
  const res = await payload.find({
    collection: 'instructors',
    where: { status: { equals: 'published' } },
    limit: 200,
    depth: 0,
    select: { slug: true },
    overrideAccess: false,
  })
  return res.docs.map((d) => d.slug)
})
