import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_activity_action" ADD VALUE 'login';
  ALTER TYPE "public"."enum_activity_action" ADD VALUE 'login-failed';
  ALTER TYPE "public"."enum_activity_action" ADD VALUE 'logout';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "activity" ALTER COLUMN "action" SET DATA TYPE text;
  DROP TYPE "public"."enum_activity_action";
  CREATE TYPE "public"."enum_activity_action" AS ENUM('create', 'update', 'delete');
  ALTER TABLE "activity" ALTER COLUMN "action" SET DATA TYPE "public"."enum_activity_action" USING "action"::"public"."enum_activity_action";`)
}
