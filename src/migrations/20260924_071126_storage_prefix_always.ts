import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // The storage plugin's `prefix` column, now in the schema whether or not S3 is configured
  // (src/lib/payload/storage.ts). The online database already had it on media, exports and
  // imports, added by hand at the first deploy, so every statement is idempotent and the
  // default is set separately for a column that already existed.
  await db.execute(sql`
  ALTER TABLE "application_files" ADD COLUMN IF NOT EXISTS "prefix" varchar;
  ALTER TABLE "session_files" ADD COLUMN IF NOT EXISTS "prefix" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "prefix" varchar;
  ALTER TABLE "exports" ADD COLUMN IF NOT EXISTS "prefix" varchar;
  ALTER TABLE "imports" ADD COLUMN IF NOT EXISTS "prefix" varchar;
  ALTER TABLE "application_files" ALTER COLUMN "prefix" SET DEFAULT 'applications';
  ALTER TABLE "session_files" ALTER COLUMN "prefix" SET DEFAULT 'session-files';
  ALTER TABLE "media" ALTER COLUMN "prefix" SET DEFAULT 'media';
  ALTER TABLE "exports" ALTER COLUMN "prefix" SET DEFAULT 'exports';
  ALTER TABLE "imports" ALTER COLUMN "prefix" SET DEFAULT 'imports';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "application_files" DROP COLUMN "prefix";
  ALTER TABLE "session_files" DROP COLUMN "prefix";
  ALTER TABLE "media" DROP COLUMN "prefix";
  ALTER TABLE "exports" DROP COLUMN "prefix";
  ALTER TABLE "imports" DROP COLUMN "prefix";`)
}
