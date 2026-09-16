import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "students_page_how_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "students_page_join_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "students_page_conduct" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "students_page_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL
  );
  
  CREATE TABLE "students_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"show_account_card" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "students_page_locales" (
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "instructors_page_guidelines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "instructors_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "instructors_page_locales" (
  	"intro" varchar,
  	"materials_body" varchar,
  	"schedule_body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "students_page_how_steps" ADD CONSTRAINT "students_page_how_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."students_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "students_page_join_steps" ADD CONSTRAINT "students_page_join_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."students_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "students_page_conduct" ADD CONSTRAINT "students_page_conduct_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."students_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "students_page_faq" ADD CONSTRAINT "students_page_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."students_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "students_page_locales" ADD CONSTRAINT "students_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."students_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "instructors_page_guidelines" ADD CONSTRAINT "instructors_page_guidelines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."instructors_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "instructors_page_locales" ADD CONSTRAINT "instructors_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."instructors_page"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "students_page_how_steps_order_idx" ON "students_page_how_steps" USING btree ("_order");
  CREATE INDEX "students_page_how_steps_parent_id_idx" ON "students_page_how_steps" USING btree ("_parent_id");
  CREATE INDEX "students_page_how_steps_locale_idx" ON "students_page_how_steps" USING btree ("_locale");
  CREATE INDEX "students_page_join_steps_order_idx" ON "students_page_join_steps" USING btree ("_order");
  CREATE INDEX "students_page_join_steps_parent_id_idx" ON "students_page_join_steps" USING btree ("_parent_id");
  CREATE INDEX "students_page_join_steps_locale_idx" ON "students_page_join_steps" USING btree ("_locale");
  CREATE INDEX "students_page_conduct_order_idx" ON "students_page_conduct" USING btree ("_order");
  CREATE INDEX "students_page_conduct_parent_id_idx" ON "students_page_conduct" USING btree ("_parent_id");
  CREATE INDEX "students_page_conduct_locale_idx" ON "students_page_conduct" USING btree ("_locale");
  CREATE INDEX "students_page_faq_order_idx" ON "students_page_faq" USING btree ("_order");
  CREATE INDEX "students_page_faq_parent_id_idx" ON "students_page_faq" USING btree ("_parent_id");
  CREATE INDEX "students_page_faq_locale_idx" ON "students_page_faq" USING btree ("_locale");
  CREATE UNIQUE INDEX "students_page_locales_locale_parent_id_unique" ON "students_page_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "instructors_page_guidelines_order_idx" ON "instructors_page_guidelines" USING btree ("_order");
  CREATE INDEX "instructors_page_guidelines_parent_id_idx" ON "instructors_page_guidelines" USING btree ("_parent_id");
  CREATE INDEX "instructors_page_guidelines_locale_idx" ON "instructors_page_guidelines" USING btree ("_locale");
  CREATE UNIQUE INDEX "instructors_page_locales_locale_parent_id_unique" ON "instructors_page_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "students_page_how_steps" CASCADE;
  DROP TABLE "students_page_join_steps" CASCADE;
  DROP TABLE "students_page_conduct" CASCADE;
  DROP TABLE "students_page_faq" CASCADE;
  DROP TABLE "students_page" CASCADE;
  DROP TABLE "students_page_locales" CASCADE;
  DROP TABLE "instructors_page_guidelines" CASCADE;
  DROP TABLE "instructors_page" CASCADE;
  DROP TABLE "instructors_page_locales" CASCADE;`)
}
