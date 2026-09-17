import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_applications_gender" AS ENUM('female', 'male');
  CREATE TYPE "public"."enum_applications_nationality" AS ENUM('IS', 'ET', 'AZ', 'AM', 'AW', 'ER', 'ES', 'AU', 'EE', 'SZ', 'AF', 'AR', 'JO', 'EC', 'AE', 'AL', 'BH', 'BR', 'PT', 'BA', 'CZ', 'ME', 'DZ', 'DK', 'CV', 'SV', 'SN', 'SD', 'SE', 'SO', 'CN', 'IQ', 'GA', 'VA', 'PH', 'CM', 'CG', 'CD', 'KW', 'DE', 'MA', 'MX', 'SA', 'GB', 'NO', 'AT', 'NE', 'IN', 'US', 'JP', 'YE', 'GR', 'AG', 'AD', 'ID', 'AO', 'UY', 'UZ', 'UG', 'UA', 'IR', 'IE', 'IT', 'PG', 'PY', 'PK', 'PW', 'BB', 'BM', 'BN', 'BE', 'BG', 'BZ', 'BD', 'PA', 'BJ', 'BT', 'BW', 'PR', 'BF', 'BI', 'PL', 'BO', 'PF', 'PE', 'BY', 'TH', 'TW', 'TM', 'TR', 'TT', 'TD', 'CL', 'TZ', 'TG', 'TV', 'TK', 'TN', 'TO', 'TL', 'JM', 'GI', 'AX', 'BS', 'KM', 'MQ', 'MV', 'TC', 'SB', 'FO', 'VI', 'VG', 'KY', 'CK', 'MH', 'MP', 'WF', 'IM', 'CF', 'DO', 'ZA', 'SS', 'GE', 'DJ', 'JE', 'DM', 'RW', 'RU', 'RO', 'RE', 'ZM', 'ZW', 'CI', 'WS', 'AS', 'PM', 'SM', 'VC', 'KN', 'LC', 'SX', 'ST', 'LK', 'SK', 'SI', 'SG', 'SY', 'SR', 'CH', 'SL', 'SC', 'RS', 'TJ', 'OM', 'GM', 'GH', 'GD', 'GL', 'GT', 'GP', 'GU', 'GF', 'GY', 'GG', 'GN', 'GQ', 'GW', 'VU', 'FR', 'PS', 'VE', 'FI', 'VN', 'FJ', 'CY', 'QA', 'KG', 'KZ', 'NC', 'HR', 'KH', 'CA', 'CU', 'CW', 'KR', 'KP', 'CR', 'XK', 'CO', 'KI', 'KE', 'LV', 'LA', 'LB', 'LU', 'LY', 'LR', 'LT', 'LI', 'LS', 'MT', 'ML', 'MY', 'YT', 'MG', 'EG', 'MK', 'MW', 'MO', 'MN', 'MR', 'MU', 'MZ', 'MD', 'MC', 'MM', 'FM', 'NA', 'NR', 'NP', 'NG', 'NI', 'NZ', 'NU', 'HT', 'HN', 'HU', 'NL', 'HK');
  CREATE TYPE "public"."enum_applications_country" AS ENUM('IS', 'ET', 'AZ', 'AM', 'AW', 'ER', 'ES', 'AU', 'EE', 'SZ', 'AF', 'AR', 'JO', 'EC', 'AE', 'AL', 'BH', 'BR', 'PT', 'BA', 'CZ', 'ME', 'DZ', 'DK', 'CV', 'SV', 'SN', 'SD', 'SE', 'SO', 'CN', 'IQ', 'GA', 'VA', 'PH', 'CM', 'CG', 'CD', 'KW', 'DE', 'MA', 'MX', 'SA', 'GB', 'NO', 'AT', 'NE', 'IN', 'US', 'JP', 'YE', 'GR', 'AG', 'AD', 'ID', 'AO', 'UY', 'UZ', 'UG', 'UA', 'IR', 'IE', 'IT', 'PG', 'PY', 'PK', 'PW', 'BB', 'BM', 'BN', 'BE', 'BG', 'BZ', 'BD', 'PA', 'BJ', 'BT', 'BW', 'PR', 'BF', 'BI', 'PL', 'BO', 'PF', 'PE', 'BY', 'TH', 'TW', 'TM', 'TR', 'TT', 'TD', 'CL', 'TZ', 'TG', 'TV', 'TK', 'TN', 'TO', 'TL', 'JM', 'GI', 'AX', 'BS', 'KM', 'MQ', 'MV', 'TC', 'SB', 'FO', 'VI', 'VG', 'KY', 'CK', 'MH', 'MP', 'WF', 'IM', 'CF', 'DO', 'ZA', 'SS', 'GE', 'DJ', 'JE', 'DM', 'RW', 'RU', 'RO', 'RE', 'ZM', 'ZW', 'CI', 'WS', 'AS', 'PM', 'SM', 'VC', 'KN', 'LC', 'SX', 'ST', 'LK', 'SK', 'SI', 'SG', 'SY', 'SR', 'CH', 'SL', 'SC', 'RS', 'TJ', 'OM', 'GM', 'GH', 'GD', 'GL', 'GT', 'GP', 'GU', 'GF', 'GY', 'GG', 'GN', 'GQ', 'GW', 'VU', 'FR', 'PS', 'VE', 'FI', 'VN', 'FJ', 'CY', 'QA', 'KG', 'KZ', 'NC', 'HR', 'KH', 'CA', 'CU', 'CW', 'KR', 'KP', 'CR', 'XK', 'CO', 'KI', 'KE', 'LV', 'LA', 'LB', 'LU', 'LY', 'LR', 'LT', 'LI', 'LS', 'MT', 'ML', 'MY', 'YT', 'MG', 'EG', 'MK', 'MW', 'MO', 'MN', 'MR', 'MU', 'MZ', 'MD', 'MC', 'MM', 'FM', 'NA', 'NR', 'NP', 'NG', 'NI', 'NZ', 'NU', 'HT', 'HN', 'HU', 'NL', 'HK');
  CREATE TYPE "public"."enum_applications_hear_about" AS ENUM('social', 'friend', 'organisation', 'event', 'search', 'other');
  CREATE TABLE "application_files" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"applicant" varchar,
  	"original_name" varchar,
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
  
  -- "country" and "hear_about" were free text; a cast to the new enums would fail on any
  -- existing row (drizzle generated USING "col"::enum). Recreate them instead: the values so
  -- far are test submissions from before the three-step form existed.
  ALTER TABLE "applications" DROP COLUMN "country";
  ALTER TABLE "applications" ADD COLUMN "country" "enum_applications_country";
  ALTER TABLE "applications" DROP COLUMN "hear_about";
  ALTER TABLE "applications" ADD COLUMN "hear_about" "enum_applications_hear_about";
  ALTER TABLE "applications" ADD COLUMN "gender" "enum_applications_gender";
  ALTER TABLE "applications" ADD COLUMN "date_of_birth" timestamp(3) with time zone;
  ALTER TABLE "applications" ADD COLUMN "nationality" "enum_applications_nationality";
  ALTER TABLE "applications" ADD COLUMN "profession" varchar;
  ALTER TABLE "applications" ADD COLUMN "affiliated" boolean DEFAULT false;
  ALTER TABLE "applications" ADD COLUMN "affiliation_name" varchar;
  ALTER TABLE "applications" ADD COLUMN "facebook" varchar;
  ALTER TABLE "applications" ADD COLUMN "instagram" varchar;
  ALTER TABLE "applications" ADD COLUMN "linkedin" varchar;
  ALTER TABLE "applications" ADD COLUMN "about_you" varchar;
  ALTER TABLE "applications" ADD COLUMN "cv_id" integer;
  ALTER TABLE "applications" ADD COLUMN "pledge" boolean DEFAULT false NOT NULL;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "application_files_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "applications_email" varchar;
  CREATE INDEX "application_files_updated_at_idx" ON "application_files" USING btree ("updated_at");
  CREATE INDEX "application_files_created_at_idx" ON "application_files" USING btree ("created_at");
  CREATE UNIQUE INDEX "application_files_filename_idx" ON "application_files" USING btree ("filename");
  ALTER TABLE "applications" ADD CONSTRAINT "applications_cv_id_application_files_id_fk" FOREIGN KEY ("cv_id") REFERENCES "public"."application_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_application_files_fk" FOREIGN KEY ("application_files_id") REFERENCES "public"."application_files"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "applications_nationality_idx" ON "applications" USING btree ("nationality");
  CREATE INDEX "applications_country_idx" ON "applications" USING btree ("country");
  CREATE INDEX "applications_cv_idx" ON "applications" USING btree ("cv_id");
  CREATE INDEX "payload_locked_documents_rels_application_files_id_idx" ON "payload_locked_documents_rels" USING btree ("application_files_id");
  ALTER TABLE "applications" DROP COLUMN "city";
  ALTER TABLE "applications" DROP COLUMN "age_range";
  DROP TYPE "public"."enum_applications_age_range";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_applications_age_range" AS ENUM('under-18', '18-24', '25-34', '35-44', '45-plus');
  ALTER TABLE "application_files" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "application_files" CASCADE;
  ALTER TABLE "applications" DROP CONSTRAINT "applications_cv_id_application_files_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_application_files_fk";
  
  DROP INDEX "applications_nationality_idx";
  DROP INDEX "applications_country_idx";
  DROP INDEX "applications_cv_idx";
  DROP INDEX "payload_locked_documents_rels_application_files_id_idx";
  ALTER TABLE "applications" DROP COLUMN "country";
  ALTER TABLE "applications" ADD COLUMN "country" varchar;
  ALTER TABLE "applications" DROP COLUMN "hear_about";
  ALTER TABLE "applications" ADD COLUMN "hear_about" varchar;
  ALTER TABLE "applications" ADD COLUMN "city" varchar;
  ALTER TABLE "applications" ADD COLUMN "age_range" "enum_applications_age_range";
  ALTER TABLE "applications" DROP COLUMN "gender";
  ALTER TABLE "applications" DROP COLUMN "date_of_birth";
  ALTER TABLE "applications" DROP COLUMN "nationality";
  ALTER TABLE "applications" DROP COLUMN "profession";
  ALTER TABLE "applications" DROP COLUMN "affiliated";
  ALTER TABLE "applications" DROP COLUMN "affiliation_name";
  ALTER TABLE "applications" DROP COLUMN "facebook";
  ALTER TABLE "applications" DROP COLUMN "instagram";
  ALTER TABLE "applications" DROP COLUMN "linkedin";
  ALTER TABLE "applications" DROP COLUMN "about_you";
  ALTER TABLE "applications" DROP COLUMN "cv_id";
  ALTER TABLE "applications" DROP COLUMN "pledge";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "application_files_id";
  ALTER TABLE "site_settings" DROP COLUMN "applications_email";
  DROP TYPE "public"."enum_applications_gender";
  DROP TYPE "public"."enum_applications_nationality";
  DROP TYPE "public"."enum_applications_country";
  DROP TYPE "public"."enum_applications_hear_about";`)
}
