import { cache } from 'react'
import type { Where } from 'payload'
import type { Locale } from '@/i18n/routing'
import type { Material } from '@/payload-types'
import { getClient, publicBase } from './client'

export const listMaterials = cache(
  async (locale: Locale, programSlug?: string): Promise<Material[]> => {
    const payload = await getClient()
    const where: Where = programSlug
      ? { and: [{ status: { equals: 'published' } }, { 'program.slug': { equals: programSlug } }] }
      : { status: { equals: 'published' } }
    const res = await payload.find({
      collection: 'materials',
      ...publicBase(locale),
      where,
      sort: '-createdAt',
      limit: 200,
    })
    return res.docs
  },
)
