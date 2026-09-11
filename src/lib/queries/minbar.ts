import { cache } from 'react'
import type { Locale } from '@/i18n/routing'
import type { MinbarPost } from '@/payload-types'
import { getClient, publicBase } from './client'

const base = (locale: Locale) => ({ collection: 'minbar-posts' as const, ...publicBase(locale) })

export const listMinbarPosts = cache(async (locale: Locale, limit = 3): Promise<MinbarPost[]> => {
  const payload = await getClient()
  const res = await payload.find({
    ...base(locale),
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    limit,
  })
  return res.docs
})

export const getMinbarPostBySlug = cache(
  async (locale: Locale, slug: string): Promise<MinbarPost | null> => {
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

export const listMinbarSlugs = cache(async (): Promise<string[]> => {
  const payload = await getClient()
  const res = await payload.find({
    collection: 'minbar-posts',
    where: { status: { equals: 'published' } },
    limit: 500,
    depth: 0,
    select: { slug: true },
    overrideAccess: false,
  })
  return res.docs.map((d) => d.slug)
})
