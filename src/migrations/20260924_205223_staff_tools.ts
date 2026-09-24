import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_applications_application_status" ADD VALUE 'withdrawn';
  ALTER TABLE "applications" ADD COLUMN "resend_invite" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "applications" ALTER COLUMN "application_status" SET DATA TYPE text;
  ALTER TABLE "applications" ALTER COLUMN "application_status" SET DEFAULT 'new'::text;
  DROP TYPE "public"."enum_applications_application_status";
  CREATE TYPE "public"."enum_applications_application_status" AS ENUM('new', 'reviewing', 'accepted', 'waitlisted', 'rejected');
  ALTER TABLE "applications" ALTER COLUMN "application_status" SET DEFAULT 'new'::"public"."enum_applications_application_status";
  ALTER TABLE "applications" ALTER COLUMN "application_status" SET DATA TYPE "public"."enum_applications_application_status" USING "application_status"::"public"."enum_applications_application_status";
  ALTER TABLE "applications" DROP COLUMN "resend_invite";`)
}
