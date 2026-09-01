ALTER TABLE "users" ADD COLUMN "external_auth_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "owner_user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_memberships" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_memberships" ADD COLUMN "invited_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_memberships" ADD COLUMN "joined_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_memberships" DROP COLUMN "is_primary";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_external_auth_id_unique" UNIQUE("external_auth_id");