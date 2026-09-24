import { s3Storage } from '@payloadcms/storage-s3'

/**
 * S3-compatible storage, switched on purely by env. Absent → each collection's local staticDir.
 *
 * The plugin is registered either way, with `alwaysInsertFields`, so the database schema
 * does not depend on env. The plugin adds a `prefix` column to every collection it manages;
 * registered only when `S3_*` was set, that column existed on the online database for the
 * collections someone added by hand and was missing from every migration generated on a
 * machine without S3. The first CV submitted online (2026-09-24) failed on
 * `select … "prefix" … from "application_files"`. Same class of bug as the admin import
 * map (CLAUDE.md); `tests/unit/storage-schema.test.ts` pins it.
 */
export function storagePlugins() {
  const { S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT, S3_REGION } = process.env
  const enabled = Boolean(S3_BUCKET && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY)
  return [
    s3Storage({
      enabled,
      alwaysInsertFields: true,
      // Every upload collection belongs here: a serverless host has no writable disk.
      // `exports`/`imports` belong to the CSV import/export plugin.
      collections: {
        media: { prefix: 'media' },
        'application-files': { prefix: 'applications' },
        'session-files': { prefix: 'session-files' },
        exports: { prefix: 'exports' },
        imports: { prefix: 'imports' },
      },
      bucket: S3_BUCKET ?? '',
      config: {
        region: S3_REGION ?? 'auto',
        endpoint: S3_ENDPOINT || undefined,
        forcePathStyle: !!S3_ENDPOINT,
        credentials: {
          accessKeyId: S3_ACCESS_KEY_ID ?? '',
          secretAccessKey: S3_SECRET_ACCESS_KEY ?? '',
        },
      },
    }),
  ]
}
