import type { CollectionConfig, Config } from 'payload'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApplicationFiles } from '@/collections/ApplicationFiles'
import { Media } from '@/collections/Media'
import { SessionFiles } from '@/collections/SessionFiles'
import { storagePlugins } from '@/lib/payload/storage'

/**
 * The schema must not depend on env. The storage plugin adds a `prefix` column to the
 * collections it manages; when it did so only with `S3_*` set, migrations generated locally
 * lacked the column and the first CV submitted online failed on
 * `select … "prefix" … from "application_files"` (2026-09-24).
 */
const uploadCollections: CollectionConfig[] = [
  Media,
  ApplicationFiles,
  SessionFiles,
  { slug: 'exports', upload: true, fields: [] },
  { slug: 'imports', upload: true, fields: [] },
]

async function fieldsAfterPlugins() {
  let config = { collections: uploadCollections, admin: {} } as unknown as Config
  for (const plugin of storagePlugins()) config = await plugin(config)
  return Object.fromEntries(
    (config.collections ?? []).map((c) => [
      c.slug,
      c.fields.flatMap((f) => ('name' in f ? [f.name] : [])),
    ]),
  )
}

afterEach(() => vi.unstubAllEnvs())

describe('storage schema', () => {
  it.each([
    ['without S3', {}],
    [
      'with S3',
      {
        S3_BUCKET: 'bucket',
        S3_ACCESS_KEY_ID: 'id',
        S3_SECRET_ACCESS_KEY: 'secret',
        S3_ENDPOINT: 'https://example.r2.cloudflarestorage.com',
      },
    ],
  ])('every upload collection has a prefix field %s', async (_, env) => {
    for (const k of ['S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_ENDPOINT'])
      vi.stubEnv(k, (env as Record<string, string>)[k] ?? '')
    const fields = await fieldsAfterPlugins()
    for (const { slug } of uploadCollections) expect(fields[slug], slug).toContain('prefix')
  })
})
