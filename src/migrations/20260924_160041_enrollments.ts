import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_enrollments_state" AS ENUM('enrolled', 'withdrawn');
  CREATE TYPE "public"."enum_enrollments_source" AS ENUM('student', 'staff');
  ALTER TYPE "public"."enum_activity_target" ADD VALUE 'enrollments' BEFORE 'instructors';
  CREATE TABLE "enrollments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"account_id" integer NOT NULL,
  	"program_id" integer NOT NULL,
  	"state" "enum_enrollments_state" DEFAULT 'enrolled' NOT NULL,
  	"source" "enum_enrollments_source" DEFAULT 'student' NOT NULL,
  	"agreed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "applications" DROP CONSTRAINT "applications_program_id_programs_id_fk";
  
  DROP INDEX "applications_program_idx";
  ALTER TABLE "accounts" ADD COLUMN "disabled" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "enrollments_id" integer;
  ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "enrollments_account_idx" ON "enrollments" USING btree ("account_id");
  CREATE INDEX "enrollments_program_idx" ON "enrollments" USING btree ("program_id");
  CREATE INDEX "enrollments_state_idx" ON "enrollments" USING btree ("state");
  CREATE INDEX "enrollments_updated_at_idx" ON "enrollments" USING btree ("updated_at");
  CREATE INDEX "enrollments_created_at_idx" ON "enrollments" USING btree ("created_at");
  CREATE UNIQUE INDEX "account_program_idx" ON "enrollments" USING btree ("account_id","program_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_enrollments_fk" FOREIGN KEY ("enrollments_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "accounts_disabled_idx" ON "accounts" USING btree ("disabled");
  CREATE INDEX "payload_locked_documents_rels_enrollments_id_idx" ON "payload_locked_documents_rels" USING btree ("enrollments_id");
  -- Before the column goes: every student whose application had a program assigned by
  -- staff keeps it, as an enrollment made by staff (the old model had one program per
  -- application, so the one-directed rule already holds). Strategic projects are not a
  -- program anyone enrolls in, so an assignment there is not carried over.
  INSERT INTO "enrollments" ("account_id", "program_id", "state", "source")
  SELECT a."id", ap."program_id", 'enrolled', 'staff'
  FROM "accounts" a
  JOIN "applications" ap ON ap."id" = a."application_id"
  JOIN "programs" p ON p."id" = ap."program_id"
  WHERE a."kind" = 'student' AND p."track" IN ('open', 'directed')
  ON CONFLICT DO NOTHING;
  ALTER TABLE "applications" DROP COLUMN "program_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "enrollments" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "enrollments" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_enrollments_fk";
  
  ALTER TABLE "activity" ALTER COLUMN "target" SET DATA TYPE text;
  DROP TYPE "public"."enum_activity_target";
  CREATE TYPE "public"."enum_activity_target" AS ENUM('programs', 'sessions', 'attendance', 'instructors', 'projects', 'minbar-posts', 'materials', 'events', 'applications', 'application-files', 'session-files', 'contact-messages', 'users', 'accounts', 'media', 'about-page', 'home-page', 'students-page', 'instructors-page', 'site-settings', 'navigation', 'footer');
  ALTER TABLE "activity" ALTER COLUMN "target" SET DATA TYPE "public"."enum_activity_target" USING "target"::"public"."enum_activity_target";
  DROP INDEX "accounts_disabled_idx";
  DROP INDEX "payload_locked_documents_rels_enrollments_id_idx";
  ALTER TABLE "applications" ADD COLUMN "program_id" integer;
  ALTER TABLE "applications" ADD CONSTRAINT "applications_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "applications_program_idx" ON "applications" USING btree ("program_id");
  ALTER TABLE "accounts" DROP COLUMN "disabled";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "enrollments_id";
  DROP TYPE "public"."enum_enrollments_state";
  DROP TYPE "public"."enum_enrollments_source";`)
}
