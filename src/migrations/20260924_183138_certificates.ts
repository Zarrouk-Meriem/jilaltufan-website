import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_certificates_kind" AS ENUM('graduation', 'attendance');
  ALTER TYPE "public"."enum_activity_target" ADD VALUE 'certificates' BEFORE 'instructors';
  CREATE TABLE "certificates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" varchar NOT NULL,
  	"kind" "enum_certificates_kind" NOT NULL,
  	"name_ar" varchar NOT NULL,
  	"name_en" varchar NOT NULL,
  	"program_title_ar" varchar NOT NULL,
  	"program_title_en" varchar NOT NULL,
  	"issued_at" timestamp(3) with time zone NOT NULL,
  	"account_id" integer,
  	"program_id" integer,
  	"revoked" boolean DEFAULT false,
  	"revoked_reason" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "enrollments" ADD COLUMN "graduated" boolean DEFAULT false;
  ALTER TABLE "enrollments" ADD COLUMN "graduated_at" timestamp(3) with time zone;
  ALTER TABLE "accounts" ADD COLUMN "official_name_ar" varchar;
  ALTER TABLE "accounts" ADD COLUMN "official_name_en" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "certificates_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "attendance_certificate_share" numeric;
  ALTER TABLE "site_settings" ADD COLUMN "graduation_attendance_share" numeric;
  ALTER TABLE "certificates" ADD CONSTRAINT "certificates_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "certificates" ADD CONSTRAINT "certificates_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "certificates_number_idx" ON "certificates" USING btree ("number");
  CREATE INDEX "certificates_account_idx" ON "certificates" USING btree ("account_id");
  CREATE INDEX "certificates_program_idx" ON "certificates" USING btree ("program_id");
  CREATE INDEX "certificates_updated_at_idx" ON "certificates" USING btree ("updated_at");
  CREATE INDEX "certificates_created_at_idx" ON "certificates" USING btree ("created_at");
  CREATE UNIQUE INDEX "account_program_kind_idx" ON "certificates" USING btree ("account_id","program_id","kind");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_certificates_fk" FOREIGN KEY ("certificates_id") REFERENCES "public"."certificates"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "enrollments_graduated_idx" ON "enrollments" USING btree ("graduated");
  CREATE INDEX "payload_locked_documents_rels_certificates_id_idx" ON "payload_locked_documents_rels" USING btree ("certificates_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "certificates" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "certificates" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_certificates_fk";
  
  ALTER TABLE "activity" ALTER COLUMN "target" SET DATA TYPE text;
  DROP TYPE "public"."enum_activity_target";
  CREATE TYPE "public"."enum_activity_target" AS ENUM('programs', 'sessions', 'attendance', 'enrollments', 'announcements', 'instructors', 'projects', 'minbar-posts', 'materials', 'events', 'applications', 'application-files', 'session-files', 'contact-messages', 'users', 'accounts', 'media', 'about-page', 'home-page', 'students-page', 'instructors-page', 'site-settings', 'navigation', 'footer');
  ALTER TABLE "activity" ALTER COLUMN "target" SET DATA TYPE "public"."enum_activity_target" USING "target"::"public"."enum_activity_target";
  DROP INDEX "enrollments_graduated_idx";
  DROP INDEX "payload_locked_documents_rels_certificates_id_idx";
  ALTER TABLE "enrollments" DROP COLUMN "graduated";
  ALTER TABLE "enrollments" DROP COLUMN "graduated_at";
  ALTER TABLE "accounts" DROP COLUMN "official_name_ar";
  ALTER TABLE "accounts" DROP COLUMN "official_name_en";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "certificates_id";
  ALTER TABLE "site_settings" DROP COLUMN "attendance_certificate_share";
  ALTER TABLE "site_settings" DROP COLUMN "graduation_attendance_share";
  DROP TYPE "public"."enum_certificates_kind";`)
}
