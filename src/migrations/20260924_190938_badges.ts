import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_badges_rule" AS ENUM('manual', 'sessions', 'graduated', 'certificate');
  CREATE TYPE "public"."enum_badges_icon" AS ENUM('award', 'graduation', 'target', 'compass', 'book', 'calendar', 'check-circle', 'users', 'globe', 'quote');
  CREATE TYPE "public"."enum_badges_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_badge_awards_source" AS ENUM('rule', 'staff');
  ALTER TYPE "public"."enum_activity_target" ADD VALUE 'badges' BEFORE 'instructors';
  ALTER TYPE "public"."enum_activity_target" ADD VALUE 'badge-awards' BEFORE 'instructors';
  CREATE TABLE "badges" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"rule" "enum_badges_rule" DEFAULT 'manual' NOT NULL,
  	"threshold" numeric,
  	"icon" "enum_badges_icon" DEFAULT 'award' NOT NULL,
  	"order" numeric DEFAULT 0,
  	"status" "enum_badges_status" DEFAULT 'draft' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "badges_locales" (
  	"name" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "badge_awards" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"account_id" integer NOT NULL,
  	"badge_id" integer NOT NULL,
  	"source" "enum_badge_awards_source" DEFAULT 'rule' NOT NULL,
  	"awarded_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "badges_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "badge_awards_id" integer;
  ALTER TABLE "badges_locales" ADD CONSTRAINT "badges_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "badge_awards" ADD CONSTRAINT "badge_awards_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "badge_awards" ADD CONSTRAINT "badge_awards_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "badges_updated_at_idx" ON "badges" USING btree ("updated_at");
  CREATE INDEX "badges_created_at_idx" ON "badges" USING btree ("created_at");
  CREATE UNIQUE INDEX "badges_locales_locale_parent_id_unique" ON "badges_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "badge_awards_account_idx" ON "badge_awards" USING btree ("account_id");
  CREATE INDEX "badge_awards_badge_idx" ON "badge_awards" USING btree ("badge_id");
  CREATE INDEX "badge_awards_updated_at_idx" ON "badge_awards" USING btree ("updated_at");
  CREATE INDEX "badge_awards_created_at_idx" ON "badge_awards" USING btree ("created_at");
  CREATE UNIQUE INDEX "account_badge_idx" ON "badge_awards" USING btree ("account_id","badge_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_badges_fk" FOREIGN KEY ("badges_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_badge_awards_fk" FOREIGN KEY ("badge_awards_id") REFERENCES "public"."badge_awards"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_badges_id_idx" ON "payload_locked_documents_rels" USING btree ("badges_id");
  CREATE INDEX "payload_locked_documents_rels_badge_awards_id_idx" ON "payload_locked_documents_rels" USING btree ("badge_awards_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "badges" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "badges_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "badge_awards" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "badges" CASCADE;
  DROP TABLE "badges_locales" CASCADE;
  DROP TABLE "badge_awards" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_badges_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_badge_awards_fk";
  
  ALTER TABLE "activity" ALTER COLUMN "target" SET DATA TYPE text;
  DROP TYPE "public"."enum_activity_target";
  CREATE TYPE "public"."enum_activity_target" AS ENUM('programs', 'sessions', 'attendance', 'enrollments', 'announcements', 'certificates', 'instructors', 'projects', 'minbar-posts', 'materials', 'events', 'applications', 'application-files', 'session-files', 'contact-messages', 'users', 'accounts', 'media', 'about-page', 'home-page', 'students-page', 'instructors-page', 'site-settings', 'navigation', 'footer');
  ALTER TABLE "activity" ALTER COLUMN "target" SET DATA TYPE "public"."enum_activity_target" USING "target"::"public"."enum_activity_target";
  DROP INDEX "payload_locked_documents_rels_badges_id_idx";
  DROP INDEX "payload_locked_documents_rels_badge_awards_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "badges_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "badge_awards_id";
  DROP TYPE "public"."enum_badges_rule";
  DROP TYPE "public"."enum_badges_icon";
  DROP TYPE "public"."enum_badges_status";
  DROP TYPE "public"."enum_badge_awards_source";`)
}
