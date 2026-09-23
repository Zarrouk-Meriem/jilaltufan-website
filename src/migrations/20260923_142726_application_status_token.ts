import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "applications" ADD COLUMN "status_token" varchar;
  ALTER TABLE "applications" ADD COLUMN "status_token_expires_at" timestamp(3) with time zone;
  CREATE UNIQUE INDEX "applications_status_token_idx" ON "applications" USING btree ("status_token");`)

  // Applications that predate the follow-up link get one too. Their confirmation letter
  // went out without it, so nobody is holding these tokens — but staff can now send the
  // link from the record if an applicant asks where their application stands.
  // Two uuids, hyphens removed: 64 hex characters, generated per row by a volatile
  // function, so the unique index above is satisfied without a loop.
  await db.execute(sql`
    UPDATE "applications"
    SET "status_token" = replace(gen_random_uuid()::text, '-', '')
                      || replace(gen_random_uuid()::text, '-', ''),
        "status_token_expires_at" = now() + interval '90 days'
    WHERE "status_token" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "applications_status_token_idx";
  ALTER TABLE "applications" DROP COLUMN "status_token";
  ALTER TABLE "applications" DROP COLUMN "status_token_expires_at";`)
}
