import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "application_files" ADD COLUMN "application_id" integer;
  ALTER TABLE "application_files" ADD CONSTRAINT "application_files_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "application_files_application_idx" ON "application_files" USING btree ("application_id");`)

  // Files written before this column existed learn their application from the other side of
  // the same relationship, so an applicant who applied earlier can still download the CV
  // they sent. A file attached to no application keeps a null and stays staff-only.
  await db.execute(sql`
    UPDATE "application_files" f
    SET "application_id" = a."id"
    FROM "applications" a
    WHERE a."cv_id" = f."id" AND f."application_id" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "application_files" DROP CONSTRAINT "application_files_application_id_applications_id_fk";
  
  DROP INDEX "application_files_application_idx";
  ALTER TABLE "application_files" DROP COLUMN "application_id";`)
}
