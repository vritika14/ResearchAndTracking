CREATE TABLE IF NOT EXISTS "task_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "task_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "note_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "note_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX IF EXISTS "enum_category_value_key";
--> statement-breakpoint
ALTER TABLE "enum" ADD COLUMN IF NOT EXISTS "tenant_id" uuid;
--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "visibility_id" uuid;
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "visibility_id" uuid;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'task_members_tenant_id_tenants_id_fk'
      AND conrelid = 'public.task_members'::regclass
  ) THEN
    ALTER TABLE "task_members"
      ADD CONSTRAINT "task_members_tenant_id_tenants_id_fk"
      FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id")
      ON DELETE cascade;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'task_members_task_id_tasks_id_fk'
      AND conrelid = 'public.task_members'::regclass
  ) THEN
    ALTER TABLE "task_members"
      ADD CONSTRAINT "task_members_task_id_tasks_id_fk"
      FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id")
      ON DELETE cascade;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'task_members_user_id_users_id_fk'
      AND conrelid = 'public.task_members'::regclass
  ) THEN
    ALTER TABLE "task_members"
      ADD CONSTRAINT "task_members_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
      ON DELETE cascade;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'note_members_tenant_id_tenants_id_fk'
      AND conrelid = 'public.note_members'::regclass
  ) THEN
    ALTER TABLE "note_members"
      ADD CONSTRAINT "note_members_tenant_id_tenants_id_fk"
      FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id")
      ON DELETE cascade;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'note_members_note_id_notes_id_fk'
      AND conrelid = 'public.note_members'::regclass
  ) THEN
    ALTER TABLE "note_members"
      ADD CONSTRAINT "note_members_note_id_notes_id_fk"
      FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id")
      ON DELETE cascade;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'note_members_user_id_users_id_fk'
      AND conrelid = 'public.note_members'::regclass
  ) THEN
    ALTER TABLE "note_members"
      ADD CONSTRAINT "note_members_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
      ON DELETE cascade;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'enum_tenant_id_tenants_id_fk'
      AND conrelid = 'public.enum'::regclass
  ) THEN
    ALTER TABLE "enum"
      ADD CONSTRAINT "enum_tenant_id_tenants_id_fk"
      FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id")
      ON DELETE cascade;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notes_visibility_id_enum_id_fk'
      AND conrelid = 'public.notes'::regclass
  ) THEN
    ALTER TABLE "notes"
      ADD CONSTRAINT "notes_visibility_id_enum_id_fk"
      FOREIGN KEY ("visibility_id") REFERENCES "public"."enum"("id");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tasks_visibility_id_enum_id_fk'
      AND conrelid = 'public.tasks'::regclass
  ) THEN
    ALTER TABLE "tasks"
      ADD CONSTRAINT "tasks_visibility_id_enum_id_fk"
      FOREIGN KEY ("visibility_id") REFERENCES "public"."enum"("id");
  END IF;
END
$$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "task_members_task_id_user_id_key"
  ON "task_members" ("task_id", "user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "note_members_note_id_user_id_key"
  ON "note_members" ("note_id", "user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "enum_category_value_key"
  ON "enum" ("category", "value", "tenant_id");
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "task_members"
  TO research_tracker_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "note_members"
  TO research_tracker_app;
  