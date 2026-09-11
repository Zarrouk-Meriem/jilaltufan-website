import { cache } from 'react'
import type { Locale } from '@/i18n/routing'
import type { Project } from '@/payload-types'
import { getClient, publicBase } from './client'

const base = (locale: Locale) => ({ collection: 'projects' as const, ...publicBase(locale) })

export const listProjects = cache(async (locale: Locale): Promise<Project[]> => {
  const payload = await getClient()
  const res = await payload.find({
    ...base(locale),
    where: { status: { equals: 'published' } },
    sort: '-createdAt',
    limit: 100,
  })
  return res.docs
})

export const getProjectBySlug = cache(
  async (locale: Locale, slug: string): Promise<Project | null> => {
    const payload = await getClient()
    const res = await payload.find({
      ...base(locale),
      where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
      limit: 1,
    })
    return res.docs[0] ?? null
  },
)

export const listProjectSlugs = cache(async (): Promise<string[]> => {
  const payload = await getClient()
  const res = await payload.find({
    collection: 'projects',
    where: { status: { equals: 'published' } },
    limit: 200,
    depth: 0,
    select: { slug: true },
    overrideAccess: false,
  })
  return res.docs.map((d) => d.slug)
})
