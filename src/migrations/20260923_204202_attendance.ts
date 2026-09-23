import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_attendance_state" AS ENUM('present', 'absent', 'excused');
  CREATE TYPE "public"."enum_attendance_source" AS ENUM('staff', 'zoom');
  ALTER TYPE "public"."enum_activity_target" ADD VALUE 'attendance' BEFORE 'instructors';
  CREATE TABLE "attendance" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"session_id" integer NOT NULL,
  	"account_id" integer NOT NULL,
  	"state" "enum_attendance_state" DEFAULT 'present' NOT NULL,
  	"source" "enum_attendance_source" DEFAULT 'staff' NOT NULL,
  	"minutes" numeric,
  	"recorded_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "attendance_id" integer;
  ALTER TABLE "attendance" ADD CONSTRAINT "attendance_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "attendance" ADD CONSTRAINT "attendance_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "attendance" ADD CONSTRAINT "attendance_recorded_by_id_users_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "attendance_session_idx" ON "attendance" USING btree ("session_id");
  CREATE INDEX "attendance_account_idx" ON "attendance" USING btree ("account_id");
  CREATE INDEX "attendance_state_idx" ON "attendance" USING btree ("state");
  CREATE INDEX "attendance_source_idx" ON "attendance" USING btree ("source");
  CREATE INDEX "attendance_recorded_by_idx" ON "attendance" USING btree ("recorded_by_id");
  CREATE INDEX "attendance_updated_at_idx" ON "attendance" USING btree ("updated_at");
  CREATE INDEX "attendance_created_at_idx" ON "attendance" USING btree ("created_at");
  CREATE UNIQUE INDEX "session_account_idx" ON "attendance" USING btree ("session_id","account_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_attendance_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendance"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_attendance_id_idx" ON "payload_locked_documents_rels" USING btree ("attendance_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "attendance" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "attendance" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_attendance_fk";
  
  ALTER TABLE "activity" ALTER COLUMN "target" SET DATA TYPE text;
  DROP TYPE "public"."enum_activity_target";
  CREATE TYPE "public"."enum_activity_target" AS ENUM('programs', 'sessions', 'instructors', 'projects', 'minbar-posts', 'materials', 'events', 'applications', 'application-files', 'session-files', 'contact-messages', 'users', 'accounts', 'media', 'about-page', 'home-page', 'students-page', 'instructors-page', 'site-settings', 'navigation', 'footer');
  ALTER TABLE "activity" ALTER COLUMN "target" SET DATA TYPE "public"."enum_activity_target" USING "target"::"public"."enum_activity_target";
  DROP INDEX "payload_locked_documents_rels_attendance_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "attendance_id";
  DROP TYPE "public"."enum_attendance_state";
  DROP TYPE "public"."enum_attendance_source";`)
}
