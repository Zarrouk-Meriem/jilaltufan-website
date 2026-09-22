import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * The admin import map is a generated file that depends on which plugins were active
 * at generation time. Missing an entry renders the admin blank on the host where the
 * plugin is active (learned on the first Vercel deploy). Keep these pinned.
 */
const importMap = readFileSync('src/app/(payload)/admin/importMap.js', 'utf8')

describe('admin import map', () => {
  it.each([
    '@payloadcms/storage-s3/client#S3ClientUploadHandler',
    '@/components/admin/Logo#Logo',
    '@/components/admin/Icon#Icon',
    '@/components/admin/ActivityCells#DocumentCell',
    '@/components/admin/ActivityCells#TimeCell',
    '@/components/admin/ActivityCells#ChangesCell',
    '@/components/admin/ActivityCells#ChangesField',
  ])('contains %s', (key) => {
    expect(importMap).toContain(`"${key}"`)
  })
})
