import { s3Storage } from '@payloadcms/storage-s3'

/** S3-compatible media storage, enabled purely by env. Absent → local ./media. */
export function storagePlugins() {
  const { S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT, S3_REGION } = process.env
  if (!S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) return []
  return [
    s3Storage({
      // `exports`/`imports` belong to the CSV import/export plugin; on a serverless host
      // (read-only filesystem) they need remote storage just like media.
      collections: {
        media: { prefix: 'media' },
        'application-files': { prefix: 'applications' },
        exports: { prefix: 'exports' },
        imports: { prefix: 'imports' },
      },
      bucket: S3_BUCKET,
      config: {
        region: S3_REGION ?? 'auto',
        endpoint: S3_ENDPOINT || undefined,
        forcePathStyle: !!S3_ENDPOINT,
        credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
      },
    }),
  ]
}
