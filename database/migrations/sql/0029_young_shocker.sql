CREATE TABLE "project_pipeline_selections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"enum_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module_pipeline_selections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"enum_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_pipeline_selections" ADD CONSTRAINT "project_pipeline_selections_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_pipeline_selections" ADD CONSTRAINT "project_pipeline_selections_enum_id_enum_id_fk" FOREIGN KEY ("enum_id") REFERENCES "public"."enum"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_pipeline_selections" ADD CONSTRAINT "module_pipeline_selections_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_pipeline_selections" ADD CONSTRAINT "module_pipeline_selections_enum_id_enum_id_fk" FOREIGN KEY ("enum_id") REFERENCES "public"."enum"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_pipeline_selections_project_id_enum_id_key" ON "project_pipeline_selections" USING btree ("project_id","enum_id");--> statement-breakpoint
CREATE UNIQUE INDEX "module_pipeline_selections_module_id_enum_id_key" ON "module_pipeline_selections" USING btree ("module_id","enum_id");