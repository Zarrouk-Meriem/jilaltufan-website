import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_instructors_contact_locale" AS ENUM('ar', 'en');
  ALTER TYPE "public"."enum_activity_target" ADD VALUE 'session-files' BEFORE 'contact-messages';
  CREATE TABLE "session_files" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"session_id" integer,
  	"sender_id" integer,
  	"original_name" varchar,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric
  );
  
  ALTER TABLE "instructors" ADD COLUMN "contact_email" varchar;
  ALTER TABLE "instructors" ADD COLUMN "contact_locale" "enum_instructors_contact_locale" DEFAULT 'ar';
  ALTER TABLE "instructors" ADD COLUMN "send_invite" boolean DEFAULT false;
  ALTER TABLE "instructors" ADD COLUMN "invite_sent_at" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "session_files_id" integer;
  ALTER TABLE "session_files" ADD CONSTRAINT "session_files_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "session_files" ADD CONSTRAINT "session_files_sender_id_accounts_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "session_files_session_idx" ON "session_files" USING btree ("session_id");
  CREATE INDEX "session_files_sender_idx" ON "session_files" USING btree ("sender_id");
  CREATE INDEX "session_files_updated_at_idx" ON "session_files" USING btree ("updated_at");
  CREATE INDEX "session_files_created_at_idx" ON "session_files" USING btree ("created_at");
  CREATE UNIQUE INDEX "session_files_filename_idx" ON "session_files" USING btree ("filename");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_session_files_fk" FOREIGN KEY ("session_files_id") REFERENCES "public"."session_files"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "instructors_contact_email_idx" ON "instructors" USING btree ("contact_email");
  CREATE INDEX "payload_locked_documents_rels_session_files_id_idx" ON "payload_locked_documents_rels" USING btree ("session_files_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "session_files" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "session_files" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_session_files_fk";
  
  ALTER TABLE "activity" ALTER COLUMN "target" SET DATA TYPE text;
  DROP TYPE "public"."enum_activity_target";
  CREATE TYPE "public"."enum_activity_target" AS ENUM('programs', 'sessions', 'instructors', 'projects', 'minbar-posts', 'materials', 'events', 'applications', 'application-files', 'contact-messages', 'users', 'accounts', 'media', 'about-page', 'home-page', 'students-page', 'instructors-page', 'site-settings', 'navigation', 'footer');
  ALTER TABLE "activity" ALTER COLUMN "target" SET DATA TYPE "public"."enum_activity_target" USING "target"::"public"."enum_activity_target";
  DROP INDEX "instructors_contact_email_idx";
  DROP INDEX "payload_locked_documents_rels_session_files_id_idx";
  ALTER TABLE "instructors" DROP COLUMN "contact_email";
  ALTER TABLE "instructors" DROP COLUMN "contact_locale";
  ALTER TABLE "instructors" DROP COLUMN "send_invite";
  ALTER TABLE "instructors" DROP COLUMN "invite_sent_at";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "session_files_id";
  DROP TYPE "public"."enum_instructors_contact_locale";`)
}
