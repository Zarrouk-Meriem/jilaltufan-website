import { cache } from 'react'
import type { Locale } from '@/i18n/routing'
import type { Program } from '@/payload-types'
import { getClient, publicBase } from './client'

export const listPrograms = cache(async (locale: Locale): Promise<Program[]> => {
  const payload = await getClient()
  const res = await payload.find({
    collection: 'programs',
    ...publicBase(locale),
    where: { status: { equals: 'published' } },
    sort: 'order',
    limit: 50,
  })
  return res.docs
})

export const getProgramBySlug = cache(
  async (locale: Locale, slug: string): Promise<Program | null> => {
    const payload = await getClient()
    const res = await payload.find({
      collection: 'programs',
      ...publicBase(locale),
      where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
      limit: 1,
    })
    return res.docs[0] ?? null
  },
)

/** Slugs for generateStaticParams — locale-independent. */
export const listProgramSlugs = cache(async (): Promise<string[]> => {
  const payload = await getClient()
  const res = await payload.find({
    collection: 'programs',
    where: { status: { equals: 'published' } },
    limit: 100,
    depth: 0,
    select: { slug: true },
    overrideAccess: false,
  })
  return res.docs.map((d) => d.slug)
})
