import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_accounts_kind" AS ENUM('student', 'instructor');
  CREATE TYPE "public"."enum_accounts_locale" AS ENUM('ar', 'en');
  ALTER TYPE "public"."enum_activity_target" ADD VALUE 'accounts' BEFORE 'media';
  CREATE TABLE "accounts_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "accounts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_accounts_kind" DEFAULT 'student' NOT NULL,
  	"name" varchar,
  	"locale" "enum_accounts_locale" DEFAULT 'ar',
  	"application_id" integer,
  	"instructor_id" integer,
  	"invite_sent_at" timestamp(3) with time zone,
  	"password_set_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "accounts_id" integer;
  ALTER TABLE "payload_preferences_rels" ADD COLUMN "accounts_id" integer;
  ALTER TABLE "accounts_sessions" ADD CONSTRAINT "accounts_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "accounts" ADD CONSTRAINT "accounts_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "accounts" ADD CONSTRAINT "accounts_instructor_id_instructors_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "accounts_sessions_order_idx" ON "accounts_sessions" USING btree ("_order");
  CREATE INDEX "accounts_sessions_parent_id_idx" ON "accounts_sessions" USING btree ("_parent_id");
  CREATE INDEX "accounts_kind_idx" ON "accounts" USING btree ("kind");
  CREATE INDEX "accounts_application_idx" ON "accounts" USING btree ("application_id");
  CREATE INDEX "accounts_instructor_idx" ON "accounts" USING btree ("instructor_id");
  CREATE INDEX "accounts_updated_at_idx" ON "accounts" USING btree ("updated_at");
  CREATE INDEX "accounts_created_at_idx" ON "accounts" USING btree ("created_at");
  CREATE UNIQUE INDEX "accounts_email_idx" ON "accounts" USING btree ("email");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_accounts_fk" FOREIGN KEY ("accounts_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_accounts_fk" FOREIGN KEY ("accounts_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_accounts_id_idx" ON "payload_locked_documents_rels" USING btree ("accounts_id");
  CREATE INDEX "payload_preferences_rels_accounts_id_idx" ON "payload_preferences_rels" USING btree ("accounts_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "accounts_sessions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "accounts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "accounts_sessions" CASCADE;
  DROP TABLE "accounts" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_accounts_fk";
  
  ALTER TABLE "payload_preferences_rels" DROP CONSTRAINT "payload_preferences_rels_accounts_fk";
  
  ALTER TABLE "activity" ALTER COLUMN "target" SET DATA TYPE text;
  DROP TYPE "public"."enum_activity_target";
  CREATE TYPE "public"."enum_activity_target" AS ENUM('programs', 'sessions', 'instructors', 'projects', 'minbar-posts', 'materials', 'events', 'applications', 'application-files', 'contact-messages', 'users', 'media', 'about-page', 'home-page', 'students-page', 'instructors-page', 'site-settings', 'navigation', 'footer');
  ALTER TABLE "activity" ALTER COLUMN "target" SET DATA TYPE "public"."enum_activity_target" USING "target"::"public"."enum_activity_target";
  DROP INDEX "payload_locked_documents_rels_accounts_id_idx";
  DROP INDEX "payload_preferences_rels_accounts_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "accounts_id";
  ALTER TABLE "payload_preferences_rels" DROP COLUMN "accounts_id";
  DROP TYPE "public"."enum_accounts_kind";
  DROP TYPE "public"."enum_accounts_locale";`)
}
