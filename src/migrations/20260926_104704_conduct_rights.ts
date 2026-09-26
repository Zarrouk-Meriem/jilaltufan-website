import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "students_page_rights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar NOT NULL
  );
  
  ALTER TABLE "students_page_conduct" ADD COLUMN "title" varchar;
  ALTER TABLE "students_page_rights" ADD CONSTRAINT "students_page_rights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."students_page"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "students_page_rights_order_idx" ON "students_page_rights" USING btree ("_order");
  CREATE INDEX "students_page_rights_parent_id_idx" ON "students_page_rights" USING btree ("_parent_id");
  CREATE INDEX "students_page_rights_locale_idx" ON "students_page_rights" USING btree ("_locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "students_page_rights" CASCADE;
  ALTER TABLE "students_page_conduct" DROP COLUMN "title";`)
}
