import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_programs_track" ADD VALUE 'projects';
  ALTER TABLE "programs" ALTER COLUMN "season_start_month" SET DEFAULT 'oct';
  ALTER TABLE "programs" ALTER COLUMN "season_end_month" SET DEFAULT 'may';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "programs" ALTER COLUMN "track" SET DATA TYPE text;
  ALTER TABLE "programs" ALTER COLUMN "track" SET DEFAULT 'directed'::text;
  DROP TYPE "public"."enum_programs_track";
  CREATE TYPE "public"."enum_programs_track" AS ENUM('open', 'directed');
  ALTER TABLE "programs" ALTER COLUMN "track" SET DEFAULT 'directed'::"public"."enum_programs_track";
  ALTER TABLE "programs" ALTER COLUMN "track" SET DATA TYPE "public"."enum_programs_track" USING "track"::"public"."enum_programs_track";
  ALTER TABLE "programs" ALTER COLUMN "season_start_month" SET DEFAULT 'sep';
  ALTER TABLE "programs" ALTER COLUMN "season_end_month" SET DEFAULT 'apr';`)
}
