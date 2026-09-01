DROP INDEX "enum_category_value_key";--> statement-breakpoint
ALTER TABLE "enum" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "enum" ADD COLUMN "module_id" uuid;--> statement-breakpoint
ALTER TABLE "enum" ADD CONSTRAINT "enum_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enum" ADD CONSTRAINT "enum_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "enum_scope_category_value_key" ON "enum" USING btree ("tenant_id","project_id","module_id","category","value");