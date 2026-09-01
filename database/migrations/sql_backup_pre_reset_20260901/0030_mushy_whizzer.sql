CREATE TABLE "conferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"acronym" text NOT NULL,
	"name" text NOT NULL,
	"location" text NOT NULL,
	"submission_due" date NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"submission_type" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conference_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"conference_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conferences" ADD CONSTRAINT "conferences_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conferences" ADD CONSTRAINT "conferences_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conference_projects" ADD CONSTRAINT "conference_projects_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conference_projects" ADD CONSTRAINT "conference_projects_conference_id_conferences_id_fk" FOREIGN KEY ("conference_id") REFERENCES "public"."conferences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conference_projects" ADD CONSTRAINT "conference_projects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conferences_tenant_id_idx" ON "conferences" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "conferences_submission_due_idx" ON "conferences" USING btree ("submission_due");--> statement-breakpoint
CREATE UNIQUE INDEX "conference_projects_conference_id_project_id_key" ON "conference_projects" USING btree ("conference_id","project_id");--> statement-breakpoint
CREATE INDEX "conference_projects_project_id_idx" ON "conference_projects" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "conference_projects_tenant_id_idx" ON "conference_projects" USING btree ("tenant_id");