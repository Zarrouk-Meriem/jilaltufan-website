import { cache } from 'react'
import type { Locale } from '@/i18n/routing'
import type { MinbarPost } from '@/payload-types'
import { getClient, publicBase } from './client'

export const listMinbarPosts = cache(async (locale: Locale, limit = 3): Promise<MinbarPost[]> => {
  const payload = await getClient()
  const res = await payload.find({
    collection: 'minbar-posts',
    ...publicBase(locale),
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    limit,
  })
  return res.docs
})
