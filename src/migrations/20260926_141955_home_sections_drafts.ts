import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_about_page_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__about_page_v_version_structure_kind" AS ENUM('council', 'team', 'committee');
  CREATE TYPE "public"."enum__about_page_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__about_page_v_published_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum_home_page_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__home_page_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__home_page_v_published_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum_students_page_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__students_page_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__students_page_v_published_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum_instructors_page_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__instructors_page_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__instructors_page_v_published_locale" AS ENUM('ar', 'en');
  CREATE TABLE "_about_page_v_version_pillars" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_about_page_v_version_goals" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_about_page_v_version_structure_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_about_page_v_version_structure" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"kind" "enum__about_page_v_version_structure_kind" DEFAULT 'council',
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_about_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version__status" "enum__about_page_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__about_page_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_about_page_v_locales" (
  	"version_title" varchar,
  	"version_intro" jsonb,
  	"version_vision" varchar,
  	"version_mission" varchar,
  	"version_structure_intro" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "home_page_pillars" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "_home_page_v_version_pillars" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_hero_image_id" integer,
  	"version_hero_cutout_id" integer,
  	"version_show_next_session" boolean DEFAULT true,
  	"version_show_mission" boolean DEFAULT true,
  	"version_show_programs" boolean DEFAULT true,
  	"version_show_season" boolean DEFAULT true,
  	"version_show_upcoming" boolean DEFAULT true,
  	"version_show_camp" boolean DEFAULT true,
  	"version_show_minbar" boolean DEFAULT true,
  	"version_show_instructors" boolean DEFAULT true,
  	"version_show_stats" boolean DEFAULT false,
  	"version__status" "enum__home_page_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__home_page_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_home_page_v_locales" (
  	"version_hero_title" varchar,
  	"version_hero_subtitle" varchar,
  	"version_primary_cta_label" varchar,
  	"version_secondary_cta_label" varchar,
  	"version_mission_title" varchar,
  	"version_mission_text" varchar,
  	"version_programs_title" varchar,
  	"version_programs_intro" varchar,
  	"version_season_title" varchar,
  	"version_season_intro" varchar,
  	"version_upcoming_title" varchar,
  	"version_upcoming_intro" varchar,
  	"version_camp_title" varchar,
  	"version_camp_intro" varchar,
  	"version_camp_cta_label" varchar,
  	"version_minbar_title" varchar,
  	"version_instructors_title" varchar,
  	"version_stats_title" varchar,
  	"version_closing_title" varchar,
  	"version_closing_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_students_page_v_version_how_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_students_page_v_version_join_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_students_page_v_version_conduct" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_students_page_v_version_rights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_students_page_v_version_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_students_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_show_account_card" boolean DEFAULT true,
  	"version__status" "enum__students_page_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__students_page_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_students_page_v_locales" (
  	"version_intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_instructors_page_v_version_guidelines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_instructors_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version__status" "enum__instructors_page_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__instructors_page_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_instructors_page_v_locales" (
  	"version_intro" varchar,
  	"version_materials_body" varchar,
  	"version_schedule_body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "about_page_pillars" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "about_page_goals" ALTER COLUMN "text" DROP NOT NULL;
  ALTER TABLE "about_page_structure_members" ALTER COLUMN "name" DROP NOT NULL;
  ALTER TABLE "about_page_structure" ALTER COLUMN "name" DROP NOT NULL;
  ALTER TABLE "students_page_how_steps" ALTER COLUMN "text" DROP NOT NULL;
  ALTER TABLE "students_page_join_steps" ALTER COLUMN "text" DROP NOT NULL;
  ALTER TABLE "students_page_conduct" ALTER COLUMN "text" DROP NOT NULL;
  ALTER TABLE "students_page_rights" ALTER COLUMN "text" DROP NOT NULL;
  ALTER TABLE "students_page_faq" ALTER COLUMN "question" DROP NOT NULL;
  ALTER TABLE "students_page_faq" ALTER COLUMN "answer" DROP NOT NULL;
  ALTER TABLE "instructors_page_guidelines" ALTER COLUMN "text" DROP NOT NULL;
  ALTER TABLE "about_page" ADD COLUMN "_status" "enum_about_page_status" DEFAULT 'draft';
  ALTER TABLE "home_page" ADD COLUMN "_status" "enum_home_page_status" DEFAULT 'draft';
  ALTER TABLE "home_page_locales" ADD COLUMN "mission_title" varchar;
  ALTER TABLE "home_page_locales" ADD COLUMN "mission_text" varchar;
  ALTER TABLE "home_page_locales" ADD COLUMN "programs_title" varchar;
  ALTER TABLE "home_page_locales" ADD COLUMN "programs_intro" varchar;
  ALTER TABLE "home_page_locales" ADD COLUMN "season_title" varchar;
  ALTER TABLE "home_page_locales" ADD COLUMN "season_intro" varchar;
  ALTER TABLE "home_page_locales" ADD COLUMN "upcoming_title" varchar;
  ALTER TABLE "home_page_locales" ADD COLUMN "upcoming_intro" varchar;
  ALTER TABLE "home_page_locales" ADD COLUMN "camp_title" varchar;
  ALTER TABLE "home_page_locales" ADD COLUMN "camp_intro" varchar;
  ALTER TABLE "home_page_locales" ADD COLUMN "camp_cta_label" varchar;
  ALTER TABLE "home_page_locales" ADD COLUMN "minbar_title" varchar;
  ALTER TABLE "home_page_locales" ADD COLUMN "instructors_title" varchar;
  ALTER TABLE "home_page_locales" ADD COLUMN "stats_title" varchar;
  ALTER TABLE "students_page" ADD COLUMN "_status" "enum_students_page_status" DEFAULT 'draft';
  ALTER TABLE "instructors_page" ADD COLUMN "_status" "enum_instructors_page_status" DEFAULT 'draft';
  ALTER TABLE "_about_page_v_version_pillars" ADD CONSTRAINT "_about_page_v_version_pillars_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_about_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_about_page_v_version_goals" ADD CONSTRAINT "_about_page_v_version_goals_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_about_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_about_page_v_version_structure_members" ADD CONSTRAINT "_about_page_v_version_structure_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_about_page_v_version_structure"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_about_page_v_version_structure" ADD CONSTRAINT "_about_page_v_version_structure_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_about_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_about_page_v_locales" ADD CONSTRAINT "_about_page_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_about_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_pillars" ADD CONSTRAINT "home_page_pillars_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_pillars" ADD CONSTRAINT "_home_page_v_version_pillars_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v" ADD CONSTRAINT "_home_page_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v" ADD CONSTRAINT "_home_page_v_version_hero_cutout_id_media_id_fk" FOREIGN KEY ("version_hero_cutout_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v_locales" ADD CONSTRAINT "_home_page_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_students_page_v_version_how_steps" ADD CONSTRAINT "_students_page_v_version_how_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_students_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_students_page_v_version_join_steps" ADD CONSTRAINT "_students_page_v_version_join_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_students_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_students_page_v_version_conduct" ADD CONSTRAINT "_students_page_v_version_conduct_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_students_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_students_page_v_version_rights" ADD CONSTRAINT "_students_page_v_version_rights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_students_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_students_page_v_version_faq" ADD CONSTRAINT "_students_page_v_version_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_students_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_students_page_v_locales" ADD CONSTRAINT "_students_page_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_students_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_instructors_page_v_version_guidelines" ADD CONSTRAINT "_instructors_page_v_version_guidelines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_instructors_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_instructors_page_v_locales" ADD CONSTRAINT "_instructors_page_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_instructors_page_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_about_page_v_version_pillars_order_idx" ON "_about_page_v_version_pillars" USING btree ("_order");
  CREATE INDEX "_about_page_v_version_pillars_parent_id_idx" ON "_about_page_v_version_pillars" USING btree ("_parent_id");
  CREATE INDEX "_about_page_v_version_pillars_locale_idx" ON "_about_page_v_version_pillars" USING btree ("_locale");
  CREATE INDEX "_about_page_v_version_goals_order_idx" ON "_about_page_v_version_goals" USING btree ("_order");
  CREATE INDEX "_about_page_v_version_goals_parent_id_idx" ON "_about_page_v_version_goals" USING btree ("_parent_id");
  CREATE INDEX "_about_page_v_version_goals_locale_idx" ON "_about_page_v_version_goals" USING btree ("_locale");
  CREATE INDEX "_about_page_v_version_structure_members_order_idx" ON "_about_page_v_version_structure_members" USING btree ("_order");
  CREATE INDEX "_about_page_v_version_structure_members_parent_id_idx" ON "_about_page_v_version_structure_members" USING btree ("_parent_id");
  CREATE INDEX "_about_page_v_version_structure_members_locale_idx" ON "_about_page_v_version_structure_members" USING btree ("_locale");
  CREATE INDEX "_about_page_v_version_structure_order_idx" ON "_about_page_v_version_structure" USING btree ("_order");
  CREATE INDEX "_about_page_v_version_structure_parent_id_idx" ON "_about_page_v_version_structure" USING btree ("_parent_id");
  CREATE INDEX "_about_page_v_version_structure_locale_idx" ON "_about_page_v_version_structure" USING btree ("_locale");
  CREATE INDEX "_about_page_v_version_version__status_idx" ON "_about_page_v" USING btree ("version__status");
  CREATE INDEX "_about_page_v_created_at_idx" ON "_about_page_v" USING btree ("created_at");
  CREATE INDEX "_about_page_v_updated_at_idx" ON "_about_page_v" USING btree ("updated_at");
  CREATE INDEX "_about_page_v_snapshot_idx" ON "_about_page_v" USING btree ("snapshot");
  CREATE INDEX "_about_page_v_published_locale_idx" ON "_about_page_v" USING btree ("published_locale");
  CREATE INDEX "_about_page_v_latest_idx" ON "_about_page_v" USING btree ("latest");
  CREATE INDEX "_about_page_v_autosave_idx" ON "_about_page_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_about_page_v_locales_locale_parent_id_unique" ON "_about_page_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_page_pillars_order_idx" ON "home_page_pillars" USING btree ("_order");
  CREATE INDEX "home_page_pillars_parent_id_idx" ON "home_page_pillars" USING btree ("_parent_id");
  CREATE INDEX "home_page_pillars_locale_idx" ON "home_page_pillars" USING btree ("_locale");
  CREATE INDEX "_home_page_v_version_pillars_order_idx" ON "_home_page_v_version_pillars" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_pillars_parent_id_idx" ON "_home_page_v_version_pillars" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_pillars_locale_idx" ON "_home_page_v_version_pillars" USING btree ("_locale");
  CREATE INDEX "_home_page_v_version_version_hero_image_idx" ON "_home_page_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_home_page_v_version_version_hero_cutout_idx" ON "_home_page_v" USING btree ("version_hero_cutout_id");
  CREATE INDEX "_home_page_v_version_version__status_idx" ON "_home_page_v" USING btree ("version__status");
  CREATE INDEX "_home_page_v_created_at_idx" ON "_home_page_v" USING btree ("created_at");
  CREATE INDEX "_home_page_v_updated_at_idx" ON "_home_page_v" USING btree ("updated_at");
  CREATE INDEX "_home_page_v_snapshot_idx" ON "_home_page_v" USING btree ("snapshot");
  CREATE INDEX "_home_page_v_published_locale_idx" ON "_home_page_v" USING btree ("published_locale");
  CREATE INDEX "_home_page_v_latest_idx" ON "_home_page_v" USING btree ("latest");
  CREATE INDEX "_home_page_v_autosave_idx" ON "_home_page_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_home_page_v_locales_locale_parent_id_unique" ON "_home_page_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_students_page_v_version_how_steps_order_idx" ON "_students_page_v_version_how_steps" USING btree ("_order");
  CREATE INDEX "_students_page_v_version_how_steps_parent_id_idx" ON "_students_page_v_version_how_steps" USING btree ("_parent_id");
  CREATE INDEX "_students_page_v_version_how_steps_locale_idx" ON "_students_page_v_version_how_steps" USING btree ("_locale");
  CREATE INDEX "_students_page_v_version_join_steps_order_idx" ON "_students_page_v_version_join_steps" USING btree ("_order");
  CREATE INDEX "_students_page_v_version_join_steps_parent_id_idx" ON "_students_page_v_version_join_steps" USING btree ("_parent_id");
  CREATE INDEX "_students_page_v_version_join_steps_locale_idx" ON "_students_page_v_version_join_steps" USING btree ("_locale");
  CREATE INDEX "_students_page_v_version_conduct_order_idx" ON "_students_page_v_version_conduct" USING btree ("_order");
  CREATE INDEX "_students_page_v_version_conduct_parent_id_idx" ON "_students_page_v_version_conduct" USING btree ("_parent_id");
  CREATE INDEX "_students_page_v_version_conduct_locale_idx" ON "_students_page_v_version_conduct" USING btree ("_locale");
  CREATE INDEX "_students_page_v_version_rights_order_idx" ON "_students_page_v_version_rights" USING btree ("_order");
  CREATE INDEX "_students_page_v_version_rights_parent_id_idx" ON "_students_page_v_version_rights" USING btree ("_parent_id");
  CREATE INDEX "_students_page_v_version_rights_locale_idx" ON "_students_page_v_version_rights" USING btree ("_locale");
  CREATE INDEX "_students_page_v_version_faq_order_idx" ON "_students_page_v_version_faq" USING btree ("_order");
  CREATE INDEX "_students_page_v_version_faq_parent_id_idx" ON "_students_page_v_version_faq" USING btree ("_parent_id");
  CREATE INDEX "_students_page_v_version_faq_locale_idx" ON "_students_page_v_version_faq" USING btree ("_locale");
  CREATE INDEX "_students_page_v_version_version__status_idx" ON "_students_page_v" USING btree ("version__status");
  CREATE INDEX "_students_page_v_created_at_idx" ON "_students_page_v" USING btree ("created_at");
  CREATE INDEX "_students_page_v_updated_at_idx" ON "_students_page_v" USING btree ("updated_at");
  CREATE INDEX "_students_page_v_snapshot_idx" ON "_students_page_v" USING btree ("snapshot");
  CREATE INDEX "_students_page_v_published_locale_idx" ON "_students_page_v" USING btree ("published_locale");
  CREATE INDEX "_students_page_v_latest_idx" ON "_students_page_v" USING btree ("latest");
  CREATE INDEX "_students_page_v_autosave_idx" ON "_students_page_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_students_page_v_locales_locale_parent_id_unique" ON "_students_page_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_instructors_page_v_version_guidelines_order_idx" ON "_instructors_page_v_version_guidelines" USING btree ("_order");
  CREATE INDEX "_instructors_page_v_version_guidelines_parent_id_idx" ON "_instructors_page_v_version_guidelines" USING btree ("_parent_id");
  CREATE INDEX "_instructors_page_v_version_guidelines_locale_idx" ON "_instructors_page_v_version_guidelines" USING btree ("_locale");
  CREATE INDEX "_instructors_page_v_version_version__status_idx" ON "_instructors_page_v" USING btree ("version__status");
  CREATE INDEX "_instructors_page_v_created_at_idx" ON "_instructors_page_v" USING btree ("created_at");
  CREATE INDEX "_instructors_page_v_updated_at_idx" ON "_instructors_page_v" USING btree ("updated_at");
  CREATE INDEX "_instructors_page_v_snapshot_idx" ON "_instructors_page_v" USING btree ("snapshot");
  CREATE INDEX "_instructors_page_v_published_locale_idx" ON "_instructors_page_v" USING btree ("published_locale");
  CREATE INDEX "_instructors_page_v_latest_idx" ON "_instructors_page_v" USING btree ("latest");
  CREATE INDEX "_instructors_page_v_autosave_idx" ON "_instructors_page_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_instructors_page_v_locales_locale_parent_id_unique" ON "_instructors_page_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "about_page__status_idx" ON "about_page" USING btree ("_status");
  CREATE INDEX "home_page__status_idx" ON "home_page" USING btree ("_status");
  CREATE INDEX "students_page__status_idx" ON "students_page" USING btree ("_status");
  CREATE INDEX "instructors_page__status_idx" ON "instructors_page" USING btree ("_status");
  -- What is live today is published; drafts start from the next edit.
  UPDATE "about_page" SET "_status" = 'published';
  UPDATE "home_page" SET "_status" = 'published';
  UPDATE "students_page" SET "_status" = 'published';
  UPDATE "instructors_page" SET "_status" = 'published';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_about_page_v_version_pillars" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_about_page_v_version_goals" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_about_page_v_version_structure_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_about_page_v_version_structure" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_about_page_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_about_page_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_pillars" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_page_v_version_pillars" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_page_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_page_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_students_page_v_version_how_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_students_page_v_version_join_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_students_page_v_version_conduct" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_students_page_v_version_rights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_students_page_v_version_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_students_page_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_students_page_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_instructors_page_v_version_guidelines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_instructors_page_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_instructors_page_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_about_page_v_version_pillars" CASCADE;
  DROP TABLE "_about_page_v_version_goals" CASCADE;
  DROP TABLE "_about_page_v_version_structure_members" CASCADE;
  DROP TABLE "_about_page_v_version_structure" CASCADE;
  DROP TABLE "_about_page_v" CASCADE;
  DROP TABLE "_about_page_v_locales" CASCADE;
  DROP TABLE "home_page_pillars" CASCADE;
  DROP TABLE "_home_page_v_version_pillars" CASCADE;
  DROP TABLE "_home_page_v" CASCADE;
  DROP TABLE "_home_page_v_locales" CASCADE;
  DROP TABLE "_students_page_v_version_how_steps" CASCADE;
  DROP TABLE "_students_page_v_version_join_steps" CASCADE;
  DROP TABLE "_students_page_v_version_conduct" CASCADE;
  DROP TABLE "_students_page_v_version_rights" CASCADE;
  DROP TABLE "_students_page_v_version_faq" CASCADE;
  DROP TABLE "_students_page_v" CASCADE;
  DROP TABLE "_students_page_v_locales" CASCADE;
  DROP TABLE "_instructors_page_v_version_guidelines" CASCADE;
  DROP TABLE "_instructors_page_v" CASCADE;
  DROP TABLE "_instructors_page_v_locales" CASCADE;
  DROP INDEX "about_page__status_idx";
  DROP INDEX "home_page__status_idx";
  DROP INDEX "students_page__status_idx";
  DROP INDEX "instructors_page__status_idx";
  ALTER TABLE "about_page_pillars" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "about_page_goals" ALTER COLUMN "text" SET NOT NULL;
  ALTER TABLE "about_page_structure_members" ALTER COLUMN "name" SET NOT NULL;
  ALTER TABLE "about_page_structure" ALTER COLUMN "name" SET NOT NULL;
  ALTER TABLE "students_page_how_steps" ALTER COLUMN "text" SET NOT NULL;
  ALTER TABLE "students_page_join_steps" ALTER COLUMN "text" SET NOT NULL;
  ALTER TABLE "students_page_conduct" ALTER COLUMN "text" SET NOT NULL;
  ALTER TABLE "students_page_rights" ALTER COLUMN "text" SET NOT NULL;
  ALTER TABLE "students_page_faq" ALTER COLUMN "question" SET NOT NULL;
  ALTER TABLE "students_page_faq" ALTER COLUMN "answer" SET NOT NULL;
  ALTER TABLE "instructors_page_guidelines" ALTER COLUMN "text" SET NOT NULL;
  ALTER TABLE "about_page" DROP COLUMN "_status";
  ALTER TABLE "home_page" DROP COLUMN "_status";
  ALTER TABLE "home_page_locales" DROP COLUMN "mission_title";
  ALTER TABLE "home_page_locales" DROP COLUMN "mission_text";
  ALTER TABLE "home_page_locales" DROP COLUMN "programs_title";
  ALTER TABLE "home_page_locales" DROP COLUMN "programs_intro";
  ALTER TABLE "home_page_locales" DROP COLUMN "season_title";
  ALTER TABLE "home_page_locales" DROP COLUMN "season_intro";
  ALTER TABLE "home_page_locales" DROP COLUMN "upcoming_title";
  ALTER TABLE "home_page_locales" DROP COLUMN "upcoming_intro";
  ALTER TABLE "home_page_locales" DROP COLUMN "camp_title";
  ALTER TABLE "home_page_locales" DROP COLUMN "camp_intro";
  ALTER TABLE "home_page_locales" DROP COLUMN "camp_cta_label";
  ALTER TABLE "home_page_locales" DROP COLUMN "minbar_title";
  ALTER TABLE "home_page_locales" DROP COLUMN "instructors_title";
  ALTER TABLE "home_page_locales" DROP COLUMN "stats_title";
  ALTER TABLE "students_page" DROP COLUMN "_status";
  ALTER TABLE "instructors_page" DROP COLUMN "_status";
  DROP TYPE "public"."enum_about_page_status";
  DROP TYPE "public"."enum__about_page_v_version_structure_kind";
  DROP TYPE "public"."enum__about_page_v_version_status";
  DROP TYPE "public"."enum__about_page_v_published_locale";
  DROP TYPE "public"."enum_home_page_status";
  DROP TYPE "public"."enum__home_page_v_version_status";
  DROP TYPE "public"."enum__home_page_v_published_locale";
  DROP TYPE "public"."enum_students_page_status";
  DROP TYPE "public"."enum__students_page_v_version_status";
  DROP TYPE "public"."enum__students_page_v_published_locale";
  DROP TYPE "public"."enum_instructors_page_status";
  DROP TYPE "public"."enum__instructors_page_v_version_status";
  DROP TYPE "public"."enum__instructors_page_v_published_locale";`)
}
