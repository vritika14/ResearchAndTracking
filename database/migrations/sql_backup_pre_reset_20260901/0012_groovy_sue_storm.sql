CREATE TABLE IF NOT EXISTS "tenant_sequences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"last_value" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "display_id" text;--> statement-breakpoint
ALTER TABLE "modules" ADD COLUMN IF NOT EXISTS "display_id" text;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "display_id" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "display_id" text;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenant_sequences_tenant_id_tenants_id_fk') THEN
    ALTER TABLE "tenant_sequences" ADD CONSTRAINT "tenant_sequences_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_sequences_tenant_id_entity_type_key" ON "tenant_sequences" USING btree ("tenant_id","entity_type");--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_display_id_unique') THEN
    ALTER TABLE "projects" ADD CONSTRAINT "projects_display_id_unique" UNIQUE("display_id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'modules_display_id_unique') THEN
    ALTER TABLE "modules" ADD CONSTRAINT "modules_display_id_unique" UNIQUE("display_id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notes_display_id_unique') THEN
    ALTER TABLE "notes" ADD CONSTRAINT "notes_display_id_unique" UNIQUE("display_id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_display_id_unique') THEN
    ALTER TABLE "tasks" ADD CONSTRAINT "tasks_display_id_unique" UNIQUE("display_id");
  END IF;
END $$;
