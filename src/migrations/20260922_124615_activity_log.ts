import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_activity_action" AS ENUM('create', 'update', 'delete');
  CREATE TYPE "public"."enum_activity_target" AS ENUM('programs', 'sessions', 'instructors', 'projects', 'minbar-posts', 'materials', 'events', 'applications', 'application-files', 'contact-messages', 'users', 'media', 'about-page', 'home-page', 'students-page', 'instructors-page', 'site-settings', 'navigation', 'footer');
  CREATE TABLE "activity" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"action" "enum_activity_action" NOT NULL,
  	"target" "enum_activity_target" NOT NULL,
  	"title" varchar,
  	"doc_id" varchar,
  	"user_id" integer,
  	"user_email" varchar,
  	"locale" varchar,
  	"changes" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "activity_id" integer;
  ALTER TABLE "activity" ADD CONSTRAINT "activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "activity_action_idx" ON "activity" USING btree ("action");
  CREATE INDEX "activity_target_idx" ON "activity" USING btree ("target");
  CREATE INDEX "activity_doc_id_idx" ON "activity" USING btree ("doc_id");
  CREATE INDEX "activity_user_idx" ON "activity" USING btree ("user_id");
  CREATE INDEX "activity_user_email_idx" ON "activity" USING btree ("user_email");
  CREATE INDEX "activity_updated_at_idx" ON "activity" USING btree ("updated_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_activity_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_activity_id_idx" ON "payload_locked_documents_rels" USING btree ("activity_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "activity" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "activity" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_activity_fk";
  
  DROP INDEX "payload_locked_documents_rels_activity_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "activity_id";
  DROP TYPE "public"."enum_activity_action";
  DROP TYPE "public"."enum_activity_target";`)
}
