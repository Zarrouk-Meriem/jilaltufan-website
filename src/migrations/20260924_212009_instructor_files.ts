import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_session_files_review" AS ENUM('pending', 'published', 'declined');
  ALTER TABLE "materials" ADD COLUMN "session_file_id" integer;
  ALTER TABLE "session_files" ADD COLUMN "review" "enum_session_files_review" DEFAULT 'pending' NOT NULL;
  ALTER TABLE "session_files" ADD COLUMN "publish" boolean DEFAULT false;
  ALTER TABLE "session_files" ADD COLUMN "material_id" integer;
  ALTER TABLE "materials" ADD CONSTRAINT "materials_session_file_id_session_files_id_fk" FOREIGN KEY ("session_file_id") REFERENCES "public"."session_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "session_files" ADD CONSTRAINT "session_files_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "materials_session_file_idx" ON "materials" USING btree ("session_file_id");
  CREATE INDEX "session_files_review_idx" ON "session_files" USING btree ("review");
  CREATE INDEX "session_files_material_idx" ON "session_files" USING btree ("material_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "materials" DROP CONSTRAINT "materials_session_file_id_session_files_id_fk";
  
  ALTER TABLE "session_files" DROP CONSTRAINT "session_files_material_id_materials_id_fk";
  
  DROP INDEX "materials_session_file_idx";
  DROP INDEX "session_files_review_idx";
  DROP INDEX "session_files_material_idx";
  ALTER TABLE "materials" DROP COLUMN "session_file_id";
  ALTER TABLE "session_files" DROP COLUMN "review";
  ALTER TABLE "session_files" DROP COLUMN "publish";
  ALTER TABLE "session_files" DROP COLUMN "material_id";
  DROP TYPE "public"."enum_session_files_review";`)
}
