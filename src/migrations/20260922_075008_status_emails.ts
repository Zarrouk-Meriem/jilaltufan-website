import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "applications" ADD COLUMN "send_rejection_email" boolean DEFAULT false;
  ALTER TABLE "applications" ADD COLUMN "reviewing_email_sent_at" timestamp(3) with time zone;
  ALTER TABLE "applications" ADD COLUMN "waitlist_email_sent_at" timestamp(3) with time zone;
  ALTER TABLE "applications" ADD COLUMN "rejection_email_sent_at" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "applications" DROP COLUMN "send_rejection_email";
  ALTER TABLE "applications" DROP COLUMN "reviewing_email_sent_at";
  ALTER TABLE "applications" DROP COLUMN "waitlist_email_sent_at";
  ALTER TABLE "applications" DROP COLUMN "rejection_email_sent_at";`)
}
