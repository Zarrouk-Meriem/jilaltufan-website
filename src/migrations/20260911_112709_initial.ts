import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum_programs_track" AS ENUM('open', 'directed');
  CREATE TYPE "public"."enum_programs_season_start_month" AS ENUM('sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug');
  CREATE TYPE "public"."enum_programs_season_end_month" AS ENUM('sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug');
  CREATE TYPE "public"."enum_programs_registration_mode" AS ENUM('open', 'application', 'closed');
  CREATE TYPE "public"."enum_programs_accent_motif" AS ENUM('none', 'keffiyeh', 'mark');
  CREATE TYPE "public"."enum_programs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_sessions_session_status" AS ENUM('scheduled', 'cancelled', 'completed');
  CREATE TYPE "public"."enum_sessions_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_instructors_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_projects_project_status" AS ENUM('ongoing', 'upcoming', 'completed');
  CREATE TYPE "public"."enum_projects_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_minbar_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_materials_type" AS ENUM('pdf', 'link', 'reading');
  CREATE TYPE "public"."enum_materials_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_events_type" AS ENUM('camp', 'activity', 'seminar');
  CREATE TYPE "public"."enum_events_registration_mode" AS ENUM('none', 'link', 'form');
  CREATE TYPE "public"."enum_events_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_applications_application_status" AS ENUM('new', 'reviewing', 'accepted', 'waitlisted', 'rejected');
  CREATE TYPE "public"."enum_applications_age_range" AS ENUM('under-18', '18-24', '25-34', '35-44', '45-plus');
  CREATE TYPE "public"."enum_applications_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum_contact_messages_message_status" AS ENUM('new', 'replied', 'archived');
  CREATE TYPE "public"."enum_contact_messages_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');
  CREATE TYPE "public"."enum_exports_format" AS ENUM('csv', 'json');
  CREATE TYPE "public"."enum_exports_sort_order" AS ENUM('asc', 'desc');
  CREATE TYPE "public"."enum_exports_locale" AS ENUM('all', 'ar', 'en');
  CREATE TYPE "public"."enum_exports_drafts" AS ENUM('yes', 'no');
  CREATE TYPE "public"."enum_imports_import_mode" AS ENUM('create', 'update', 'upsert');
  CREATE TYPE "public"."enum_imports_status" AS ENUM('pending', 'completed', 'partial', 'failed');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'createCollectionExport', 'createCollectionImport');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'createCollectionExport', 'createCollectionImport');
  CREATE TYPE "public"."enum_about_page_structure_kind" AS ENUM('council', 'team', 'committee');
  CREATE TYPE "public"."enum_site_settings_socials_platform" AS ENUM('instagram', 'x', 'facebook', 'youtube', 'telegram', 'tiktok', 'linkedin', 'other');
  CREATE TYPE "public"."enum_site_settings_join_link_visibility" AS ENUM('always', 'window', 'email-only');
  CREATE TABLE "programs_goals" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "programs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"track" "enum_programs_track" DEFAULT 'directed' NOT NULL,
  	"season_start_month" "enum_programs_season_start_month" DEFAULT 'sep',
  	"season_end_month" "enum_programs_season_end_month" DEFAULT 'apr',
  	"sessions_count" numeric DEFAULT 8,
  	"registration_mode" "enum_programs_registration_mode" DEFAULT 'application' NOT NULL,
  	"registration_deadline" timestamp(3) with time zone,
  	"seo_og_image_id" integer,
  	"cover_image_id" integer,
  	"accent_motif" "enum_programs_accent_motif" DEFAULT 'none',
  	"featured" boolean DEFAULT false,
  	"order" numeric DEFAULT 0,
  	"status" "enum_programs_status" DEFAULT 'draft' NOT NULL,
  	"slug" varchar NOT NULL,
  	"is_placeholder" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "programs_locales" (
  	"title" varchar NOT NULL,
  	"short_description" varchar,
  	"intro" jsonb,
  	"target_audience" jsonb,
  	"duration_summary" varchar,
  	"registration_note" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "programs_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"instructors_id" integer
  );
  
  CREATE TABLE "sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"program_id" integer NOT NULL,
  	"number" numeric NOT NULL,
  	"starts_at" timestamp(3) with time zone NOT NULL,
  	"duration_minutes" numeric DEFAULT 90,
  	"zoom_join_url" varchar,
  	"zoom_meeting_id" varchar,
  	"zoom_passcode" varchar,
  	"session_status" "enum_sessions_session_status" DEFAULT 'scheduled' NOT NULL,
  	"status" "enum_sessions_status" DEFAULT 'draft' NOT NULL,
  	"is_placeholder" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "sessions_locales" (
  	"title" varchar NOT NULL,
  	"summary" varchar,
  	"details" jsonb,
  	"materials_note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "sessions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"instructors_id" integer
  );
  
  CREATE TABLE "instructors_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "instructors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"photo_id" integer,
  	"seo_og_image_id" integer,
  	"status" "enum_instructors_status" DEFAULT 'draft' NOT NULL,
  	"slug" varchar NOT NULL,
  	"is_placeholder" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "instructors_locales" (
  	"name" varchar NOT NULL,
  	"role" varchar,
  	"short_bio" varchar,
  	"bio" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "projects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"project_status" "enum_projects_project_status" DEFAULT 'ongoing',
  	"seo_og_image_id" integer,
  	"status" "enum_projects_status" DEFAULT 'draft' NOT NULL,
  	"slug" varchar NOT NULL,
  	"is_placeholder" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "projects_locales" (
  	"title" varchar NOT NULL,
  	"summary" varchar,
  	"body" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "minbar_posts_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar NOT NULL
  );
  
  CREATE TABLE "minbar_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"cover_id" integer,
  	"author_id" integer,
  	"published_at" timestamp(3) with time zone NOT NULL,
  	"seo_og_image_id" integer,
  	"status" "enum_minbar_posts_status" DEFAULT 'draft' NOT NULL,
  	"slug" varchar NOT NULL,
  	"is_placeholder" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "minbar_posts_locales" (
  	"title" varchar NOT NULL,
  	"excerpt" varchar,
  	"body" jsonb NOT NULL,
  	"author_name" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "materials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"program_id" integer,
  	"session_id" integer,
  	"type" "enum_materials_type" DEFAULT 'pdf' NOT NULL,
  	"file_id" integer,
  	"url" varchar,
  	"status" "enum_materials_status" DEFAULT 'draft' NOT NULL,
  	"is_placeholder" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "materials_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "events_programme_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"time" varchar,
  	"title" varchar NOT NULL,
  	"description" varchar
  );
  
  CREATE TABLE "events_programme" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"day_title" varchar NOT NULL,
  	"date" timestamp(3) with time zone
  );
  
  CREATE TABLE "events_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL
  );
  
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum_events_type" DEFAULT 'activity' NOT NULL,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"end_date" timestamp(3) with time zone,
  	"is_online" boolean DEFAULT false,
  	"registration_mode" "enum_events_registration_mode" DEFAULT 'none',
  	"registration_link" varchar,
  	"cover_image_id" integer,
  	"seo_og_image_id" integer,
  	"status" "enum_events_status" DEFAULT 'draft' NOT NULL,
  	"slug" varchar NOT NULL,
  	"is_placeholder" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "events_locales" (
  	"title" varchar NOT NULL,
  	"location" varchar,
  	"summary" varchar,
  	"body" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "applications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"program_id" integer NOT NULL,
  	"application_status" "enum_applications_application_status" DEFAULT 'new' NOT NULL,
  	"full_name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"country" varchar,
  	"city" varchar,
  	"age_range" "enum_applications_age_range",
  	"motivation" varchar,
  	"hear_about" varchar,
  	"consent" boolean DEFAULT false NOT NULL,
  	"locale" "enum_applications_locale",
  	"internal_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "contact_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"subject" varchar NOT NULL,
  	"message" varchar NOT NULL,
  	"message_status" "enum_contact_messages_message_status" DEFAULT 'new' NOT NULL,
  	"locale" "enum_contact_messages_locale",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" "enum_users_role" DEFAULT 'editor' NOT NULL,
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
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "exports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"format" "enum_exports_format" DEFAULT 'csv' NOT NULL,
  	"limit" numeric,
  	"page" numeric DEFAULT 1,
  	"sort" varchar,
  	"sort_order" "enum_exports_sort_order",
  	"locale" "enum_exports_locale" DEFAULT 'all',
  	"drafts" "enum_exports_drafts" DEFAULT 'yes',
  	"collection_slug" varchar DEFAULT 'applications' NOT NULL,
  	"where" jsonb DEFAULT '{}'::jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "exports_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "imports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"collection_slug" varchar NOT NULL,
  	"import_mode" "enum_imports_import_mode",
  	"match_field" varchar DEFAULT 'id',
  	"status" "enum_imports_status" DEFAULT 'pending',
  	"summary_imported" numeric,
  	"summary_updated" numeric,
  	"summary_total" numeric,
  	"summary_issues" numeric,
  	"summary_issue_details" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"programs_id" integer,
  	"sessions_id" integer,
  	"instructors_id" integer,
  	"projects_id" integer,
  	"minbar_posts_id" integer,
  	"materials_id" integer,
  	"events_id" integer,
  	"applications_id" integer,
  	"contact_messages_id" integer,
  	"users_id" integer,
  	"media_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "about_page_pillars" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "about_page_goals" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "about_page_structure_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" varchar
  );
  
  CREATE TABLE "about_page_structure" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"kind" "enum_about_page_structure_kind" DEFAULT 'council',
  	"description" varchar
  );
  
  CREATE TABLE "about_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "about_page_locales" (
  	"title" varchar,
  	"intro" jsonb,
  	"vision" varchar,
  	"mission" varchar,
  	"structure_intro" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "home_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_image_id" integer,
  	"show_next_session" boolean DEFAULT true,
  	"show_mission" boolean DEFAULT true,
  	"show_programs" boolean DEFAULT true,
  	"show_season" boolean DEFAULT true,
  	"show_upcoming" boolean DEFAULT true,
  	"show_camp" boolean DEFAULT true,
  	"show_minbar" boolean DEFAULT true,
  	"show_instructors" boolean DEFAULT true,
  	"show_stats" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_page_locales" (
  	"hero_title" varchar,
  	"hero_subtitle" varchar,
  	"primary_cta_label" varchar,
  	"secondary_cta_label" varchar,
  	"closing_title" varchar,
  	"closing_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "site_settings_socials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_site_settings_socials_platform" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_stats_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"contact_email" varchar DEFAULT 'contact@jilaltufan.com' NOT NULL,
  	"whatsapp" varchar,
  	"academy_time_zone" varchar DEFAULT 'Asia/Hebron' NOT NULL,
  	"join_link_visibility" "enum_site_settings_join_link_visibility" DEFAULT 'window' NOT NULL,
  	"join_window_minutes" numeric DEFAULT 30,
  	"announcement_enabled" boolean DEFAULT false,
  	"announcement_link" varchar,
  	"stats_enabled" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_settings_locales" (
  	"announcement_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "navigation_primary" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_primary_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_utility" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_utility_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"cta_href" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "navigation_locales" (
  	"cta_label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "footer_columns_links_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "footer_columns_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "footer" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "footer_locales" (
  	"blurb" varchar,
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "programs_goals" ADD CONSTRAINT "programs_goals_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs" ADD CONSTRAINT "programs_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programs" ADD CONSTRAINT "programs_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programs_locales" ADD CONSTRAINT "programs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_rels" ADD CONSTRAINT "programs_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_rels" ADD CONSTRAINT "programs_rels_instructors_fk" FOREIGN KEY ("instructors_id") REFERENCES "public"."instructors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sessions_locales" ADD CONSTRAINT "sessions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sessions_rels" ADD CONSTRAINT "sessions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sessions_rels" ADD CONSTRAINT "sessions_rels_instructors_fk" FOREIGN KEY ("instructors_id") REFERENCES "public"."instructors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "instructors_links" ADD CONSTRAINT "instructors_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."instructors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "instructors" ADD CONSTRAINT "instructors_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "instructors" ADD CONSTRAINT "instructors_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "instructors_locales" ADD CONSTRAINT "instructors_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."instructors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_locales" ADD CONSTRAINT "projects_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "minbar_posts_tags" ADD CONSTRAINT "minbar_posts_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."minbar_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "minbar_posts" ADD CONSTRAINT "minbar_posts_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "minbar_posts" ADD CONSTRAINT "minbar_posts_author_id_instructors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."instructors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "minbar_posts" ADD CONSTRAINT "minbar_posts_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "minbar_posts_locales" ADD CONSTRAINT "minbar_posts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."minbar_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "materials" ADD CONSTRAINT "materials_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "materials" ADD CONSTRAINT "materials_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "materials" ADD CONSTRAINT "materials_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "materials_locales" ADD CONSTRAINT "materials_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_programme_items" ADD CONSTRAINT "events_programme_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events_programme"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_programme" ADD CONSTRAINT "events_programme_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_gallery" ADD CONSTRAINT "events_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_gallery" ADD CONSTRAINT "events_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_locales" ADD CONSTRAINT "events_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "applications" ADD CONSTRAINT "applications_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exports_texts" ADD CONSTRAINT "exports_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."exports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_programs_fk" FOREIGN KEY ("programs_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sessions_fk" FOREIGN KEY ("sessions_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_instructors_fk" FOREIGN KEY ("instructors_id") REFERENCES "public"."instructors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_minbar_posts_fk" FOREIGN KEY ("minbar_posts_id") REFERENCES "public"."minbar_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_materials_fk" FOREIGN KEY ("materials_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_applications_fk" FOREIGN KEY ("applications_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contact_messages_fk" FOREIGN KEY ("contact_messages_id") REFERENCES "public"."contact_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_pillars" ADD CONSTRAINT "about_page_pillars_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_goals" ADD CONSTRAINT "about_page_goals_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_structure_members" ADD CONSTRAINT "about_page_structure_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page_structure"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_structure" ADD CONSTRAINT "about_page_structure_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_locales" ADD CONSTRAINT "about_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page_locales" ADD CONSTRAINT "home_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_socials" ADD CONSTRAINT "site_settings_socials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_stats" ADD CONSTRAINT "site_settings_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_stats_locales" ADD CONSTRAINT "site_settings_stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_locales" ADD CONSTRAINT "site_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_primary" ADD CONSTRAINT "navigation_primary_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_primary_locales" ADD CONSTRAINT "navigation_primary_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_primary"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_utility" ADD CONSTRAINT "navigation_utility_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_utility_locales" ADD CONSTRAINT "navigation_utility_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_utility"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_locales" ADD CONSTRAINT "navigation_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_columns_links" ADD CONSTRAINT "footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_columns_links_locales" ADD CONSTRAINT "footer_columns_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_columns_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_columns" ADD CONSTRAINT "footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_columns_locales" ADD CONSTRAINT "footer_columns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_locales" ADD CONSTRAINT "footer_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "programs_goals_order_idx" ON "programs_goals" USING btree ("_order");
  CREATE INDEX "programs_goals_parent_id_idx" ON "programs_goals" USING btree ("_parent_id");
  CREATE INDEX "programs_goals_locale_idx" ON "programs_goals" USING btree ("_locale");
  CREATE INDEX "programs_seo_seo_og_image_idx" ON "programs" USING btree ("seo_og_image_id");
  CREATE INDEX "programs_cover_image_idx" ON "programs" USING btree ("cover_image_id");
  CREATE UNIQUE INDEX "programs_slug_idx" ON "programs" USING btree ("slug");
  CREATE INDEX "programs_updated_at_idx" ON "programs" USING btree ("updated_at");
  CREATE INDEX "programs_created_at_idx" ON "programs" USING btree ("created_at");
  CREATE UNIQUE INDEX "programs_locales_locale_parent_id_unique" ON "programs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "programs_rels_order_idx" ON "programs_rels" USING btree ("order");
  CREATE INDEX "programs_rels_parent_idx" ON "programs_rels" USING btree ("parent_id");
  CREATE INDEX "programs_rels_path_idx" ON "programs_rels" USING btree ("path");
  CREATE INDEX "programs_rels_instructors_id_idx" ON "programs_rels" USING btree ("instructors_id");
  CREATE INDEX "sessions_program_idx" ON "sessions" USING btree ("program_id");
  CREATE INDEX "sessions_starts_at_idx" ON "sessions" USING btree ("starts_at");
  CREATE INDEX "sessions_updated_at_idx" ON "sessions" USING btree ("updated_at");
  CREATE INDEX "sessions_created_at_idx" ON "sessions" USING btree ("created_at");
  CREATE UNIQUE INDEX "sessions_locales_locale_parent_id_unique" ON "sessions_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "sessions_rels_order_idx" ON "sessions_rels" USING btree ("order");
  CREATE INDEX "sessions_rels_parent_idx" ON "sessions_rels" USING btree ("parent_id");
  CREATE INDEX "sessions_rels_path_idx" ON "sessions_rels" USING btree ("path");
  CREATE INDEX "sessions_rels_instructors_id_idx" ON "sessions_rels" USING btree ("instructors_id");
  CREATE INDEX "instructors_links_order_idx" ON "instructors_links" USING btree ("_order");
  CREATE INDEX "instructors_links_parent_id_idx" ON "instructors_links" USING btree ("_parent_id");
  CREATE INDEX "instructors_photo_idx" ON "instructors" USING btree ("photo_id");
  CREATE INDEX "instructors_seo_seo_og_image_idx" ON "instructors" USING btree ("seo_og_image_id");
  CREATE UNIQUE INDEX "instructors_slug_idx" ON "instructors" USING btree ("slug");
  CREATE INDEX "instructors_updated_at_idx" ON "instructors" USING btree ("updated_at");
  CREATE INDEX "instructors_created_at_idx" ON "instructors" USING btree ("created_at");
  CREATE UNIQUE INDEX "instructors_locales_locale_parent_id_unique" ON "instructors_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_image_idx" ON "projects" USING btree ("image_id");
  CREATE INDEX "projects_seo_seo_og_image_idx" ON "projects" USING btree ("seo_og_image_id");
  CREATE UNIQUE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");
  CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
  CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");
  CREATE UNIQUE INDEX "projects_locales_locale_parent_id_unique" ON "projects_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "minbar_posts_tags_order_idx" ON "minbar_posts_tags" USING btree ("_order");
  CREATE INDEX "minbar_posts_tags_parent_id_idx" ON "minbar_posts_tags" USING btree ("_parent_id");
  CREATE INDEX "minbar_posts_tags_locale_idx" ON "minbar_posts_tags" USING btree ("_locale");
  CREATE INDEX "minbar_posts_cover_idx" ON "minbar_posts" USING btree ("cover_id");
  CREATE INDEX "minbar_posts_author_idx" ON "minbar_posts" USING btree ("author_id");
  CREATE INDEX "minbar_posts_seo_seo_og_image_idx" ON "minbar_posts" USING btree ("seo_og_image_id");
  CREATE UNIQUE INDEX "minbar_posts_slug_idx" ON "minbar_posts" USING btree ("slug");
  CREATE INDEX "minbar_posts_updated_at_idx" ON "minbar_posts" USING btree ("updated_at");
  CREATE INDEX "minbar_posts_created_at_idx" ON "minbar_posts" USING btree ("created_at");
  CREATE UNIQUE INDEX "minbar_posts_locales_locale_parent_id_unique" ON "minbar_posts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "materials_program_idx" ON "materials" USING btree ("program_id");
  CREATE INDEX "materials_session_idx" ON "materials" USING btree ("session_id");
  CREATE INDEX "materials_file_idx" ON "materials" USING btree ("file_id");
  CREATE INDEX "materials_updated_at_idx" ON "materials" USING btree ("updated_at");
  CREATE INDEX "materials_created_at_idx" ON "materials" USING btree ("created_at");
  CREATE UNIQUE INDEX "materials_locales_locale_parent_id_unique" ON "materials_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "events_programme_items_order_idx" ON "events_programme_items" USING btree ("_order");
  CREATE INDEX "events_programme_items_parent_id_idx" ON "events_programme_items" USING btree ("_parent_id");
  CREATE INDEX "events_programme_items_locale_idx" ON "events_programme_items" USING btree ("_locale");
  CREATE INDEX "events_programme_order_idx" ON "events_programme" USING btree ("_order");
  CREATE INDEX "events_programme_parent_id_idx" ON "events_programme" USING btree ("_parent_id");
  CREATE INDEX "events_programme_locale_idx" ON "events_programme" USING btree ("_locale");
  CREATE INDEX "events_gallery_order_idx" ON "events_gallery" USING btree ("_order");
  CREATE INDEX "events_gallery_parent_id_idx" ON "events_gallery" USING btree ("_parent_id");
  CREATE INDEX "events_gallery_image_idx" ON "events_gallery" USING btree ("image_id");
  CREATE INDEX "events_cover_image_idx" ON "events" USING btree ("cover_image_id");
  CREATE INDEX "events_seo_seo_og_image_idx" ON "events" USING btree ("seo_og_image_id");
  CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE UNIQUE INDEX "events_locales_locale_parent_id_unique" ON "events_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "applications_program_idx" ON "applications" USING btree ("program_id");
  CREATE INDEX "applications_application_status_idx" ON "applications" USING btree ("application_status");
  CREATE INDEX "applications_email_idx" ON "applications" USING btree ("email");
  CREATE INDEX "applications_updated_at_idx" ON "applications" USING btree ("updated_at");
  CREATE INDEX "applications_created_at_idx" ON "applications" USING btree ("created_at");
  CREATE INDEX "contact_messages_updated_at_idx" ON "contact_messages" USING btree ("updated_at");
  CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages" USING btree ("created_at");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "exports_updated_at_idx" ON "exports" USING btree ("updated_at");
  CREATE INDEX "exports_created_at_idx" ON "exports" USING btree ("created_at");
  CREATE UNIQUE INDEX "exports_filename_idx" ON "exports" USING btree ("filename");
  CREATE INDEX "exports_texts_order_parent" ON "exports_texts" USING btree ("order","parent_id");
  CREATE INDEX "imports_updated_at_idx" ON "imports" USING btree ("updated_at");
  CREATE INDEX "imports_created_at_idx" ON "imports" USING btree ("created_at");
  CREATE UNIQUE INDEX "imports_filename_idx" ON "imports" USING btree ("filename");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_programs_id_idx" ON "payload_locked_documents_rels" USING btree ("programs_id");
  CREATE INDEX "payload_locked_documents_rels_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("sessions_id");
  CREATE INDEX "payload_locked_documents_rels_instructors_id_idx" ON "payload_locked_documents_rels" USING btree ("instructors_id");
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");
  CREATE INDEX "payload_locked_documents_rels_minbar_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("minbar_posts_id");
  CREATE INDEX "payload_locked_documents_rels_materials_id_idx" ON "payload_locked_documents_rels" USING btree ("materials_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_applications_id_idx" ON "payload_locked_documents_rels" USING btree ("applications_id");
  CREATE INDEX "payload_locked_documents_rels_contact_messages_id_idx" ON "payload_locked_documents_rels" USING btree ("contact_messages_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "about_page_pillars_order_idx" ON "about_page_pillars" USING btree ("_order");
  CREATE INDEX "about_page_pillars_parent_id_idx" ON "about_page_pillars" USING btree ("_parent_id");
  CREATE INDEX "about_page_pillars_locale_idx" ON "about_page_pillars" USING btree ("_locale");
  CREATE INDEX "about_page_goals_order_idx" ON "about_page_goals" USING btree ("_order");
  CREATE INDEX "about_page_goals_parent_id_idx" ON "about_page_goals" USING btree ("_parent_id");
  CREATE INDEX "about_page_goals_locale_idx" ON "about_page_goals" USING btree ("_locale");
  CREATE INDEX "about_page_structure_members_order_idx" ON "about_page_structure_members" USING btree ("_order");
  CREATE INDEX "about_page_structure_members_parent_id_idx" ON "about_page_structure_members" USING btree ("_parent_id");
  CREATE INDEX "about_page_structure_members_locale_idx" ON "about_page_structure_members" USING btree ("_locale");
  CREATE INDEX "about_page_structure_order_idx" ON "about_page_structure" USING btree ("_order");
  CREATE INDEX "about_page_structure_parent_id_idx" ON "about_page_structure" USING btree ("_parent_id");
  CREATE INDEX "about_page_structure_locale_idx" ON "about_page_structure" USING btree ("_locale");
  CREATE UNIQUE INDEX "about_page_locales_locale_parent_id_unique" ON "about_page_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_page_hero_image_idx" ON "home_page" USING btree ("hero_image_id");
  CREATE UNIQUE INDEX "home_page_locales_locale_parent_id_unique" ON "home_page_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_socials_order_idx" ON "site_settings_socials" USING btree ("_order");
  CREATE INDEX "site_settings_socials_parent_id_idx" ON "site_settings_socials" USING btree ("_parent_id");
  CREATE INDEX "site_settings_stats_order_idx" ON "site_settings_stats" USING btree ("_order");
  CREATE INDEX "site_settings_stats_parent_id_idx" ON "site_settings_stats" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_stats_locales_locale_parent_id_unique" ON "site_settings_stats_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "site_settings_locales_locale_parent_id_unique" ON "site_settings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_primary_order_idx" ON "navigation_primary" USING btree ("_order");
  CREATE INDEX "navigation_primary_parent_id_idx" ON "navigation_primary" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_primary_locales_locale_parent_id_unique" ON "navigation_primary_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_utility_order_idx" ON "navigation_utility" USING btree ("_order");
  CREATE INDEX "navigation_utility_parent_id_idx" ON "navigation_utility" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_utility_locales_locale_parent_id_unique" ON "navigation_utility_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "navigation_locales_locale_parent_id_unique" ON "navigation_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "footer_columns_links_order_idx" ON "footer_columns_links" USING btree ("_order");
  CREATE INDEX "footer_columns_links_parent_id_idx" ON "footer_columns_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "footer_columns_links_locales_locale_parent_id_unique" ON "footer_columns_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "footer_columns_order_idx" ON "footer_columns" USING btree ("_order");
  CREATE INDEX "footer_columns_parent_id_idx" ON "footer_columns" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "footer_columns_locales_locale_parent_id_unique" ON "footer_columns_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "footer_locales_locale_parent_id_unique" ON "footer_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "programs_goals" CASCADE;
  DROP TABLE "programs" CASCADE;
  DROP TABLE "programs_locales" CASCADE;
  DROP TABLE "programs_rels" CASCADE;
  DROP TABLE "sessions" CASCADE;
  DROP TABLE "sessions_locales" CASCADE;
  DROP TABLE "sessions_rels" CASCADE;
  DROP TABLE "instructors_links" CASCADE;
  DROP TABLE "instructors" CASCADE;
  DROP TABLE "instructors_locales" CASCADE;
  DROP TABLE "projects" CASCADE;
  DROP TABLE "projects_locales" CASCADE;
  DROP TABLE "minbar_posts_tags" CASCADE;
  DROP TABLE "minbar_posts" CASCADE;
  DROP TABLE "minbar_posts_locales" CASCADE;
  DROP TABLE "materials" CASCADE;
  DROP TABLE "materials_locales" CASCADE;
  DROP TABLE "events_programme_items" CASCADE;
  DROP TABLE "events_programme" CASCADE;
  DROP TABLE "events_gallery" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "events_locales" CASCADE;
  DROP TABLE "applications" CASCADE;
  DROP TABLE "contact_messages" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "exports" CASCADE;
  DROP TABLE "exports_texts" CASCADE;
  DROP TABLE "imports" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "about_page_pillars" CASCADE;
  DROP TABLE "about_page_goals" CASCADE;
  DROP TABLE "about_page_structure_members" CASCADE;
  DROP TABLE "about_page_structure" CASCADE;
  DROP TABLE "about_page" CASCADE;
  DROP TABLE "about_page_locales" CASCADE;
  DROP TABLE "home_page" CASCADE;
  DROP TABLE "home_page_locales" CASCADE;
  DROP TABLE "site_settings_socials" CASCADE;
  DROP TABLE "site_settings_stats" CASCADE;
  DROP TABLE "site_settings_stats_locales" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "site_settings_locales" CASCADE;
  DROP TABLE "navigation_primary" CASCADE;
  DROP TABLE "navigation_primary_locales" CASCADE;
  DROP TABLE "navigation_utility" CASCADE;
  DROP TABLE "navigation_utility_locales" CASCADE;
  DROP TABLE "navigation" CASCADE;
  DROP TABLE "navigation_locales" CASCADE;
  DROP TABLE "footer_columns_links" CASCADE;
  DROP TABLE "footer_columns_links_locales" CASCADE;
  DROP TABLE "footer_columns" CASCADE;
  DROP TABLE "footer_columns_locales" CASCADE;
  DROP TABLE "footer" CASCADE;
  DROP TABLE "footer_locales" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_programs_track";
  DROP TYPE "public"."enum_programs_season_start_month";
  DROP TYPE "public"."enum_programs_season_end_month";
  DROP TYPE "public"."enum_programs_registration_mode";
  DROP TYPE "public"."enum_programs_accent_motif";
  DROP TYPE "public"."enum_programs_status";
  DROP TYPE "public"."enum_sessions_session_status";
  DROP TYPE "public"."enum_sessions_status";
  DROP TYPE "public"."enum_instructors_status";
  DROP TYPE "public"."enum_projects_project_status";
  DROP TYPE "public"."enum_projects_status";
  DROP TYPE "public"."enum_minbar_posts_status";
  DROP TYPE "public"."enum_materials_type";
  DROP TYPE "public"."enum_materials_status";
  DROP TYPE "public"."enum_events_type";
  DROP TYPE "public"."enum_events_registration_mode";
  DROP TYPE "public"."enum_events_status";
  DROP TYPE "public"."enum_applications_application_status";
  DROP TYPE "public"."enum_applications_age_range";
  DROP TYPE "public"."enum_applications_locale";
  DROP TYPE "public"."enum_contact_messages_message_status";
  DROP TYPE "public"."enum_contact_messages_locale";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_exports_format";
  DROP TYPE "public"."enum_exports_sort_order";
  DROP TYPE "public"."enum_exports_locale";
  DROP TYPE "public"."enum_exports_drafts";
  DROP TYPE "public"."enum_imports_import_mode";
  DROP TYPE "public"."enum_imports_status";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  DROP TYPE "public"."enum_about_page_structure_kind";
  DROP TYPE "public"."enum_site_settings_socials_platform";
  DROP TYPE "public"."enum_site_settings_join_link_visibility";`)
}
