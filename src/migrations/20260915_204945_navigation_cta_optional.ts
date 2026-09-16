import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "navigation" ALTER COLUMN "cta_href" DROP NOT NULL;
  ALTER TABLE "navigation_locales" ALTER COLUMN "cta_label" DROP NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "navigation" ALTER COLUMN "cta_href" SET NOT NULL;
  ALTER TABLE "navigation_locales" ALTER COLUMN "cta_label" SET NOT NULL;`)
}
