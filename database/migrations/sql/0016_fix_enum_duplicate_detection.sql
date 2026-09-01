-- Custom SQL migration file, put your code below! --
DROP INDEX enum_scope_category_value_key;
--> statement-breakpoint
CREATE UNIQUE INDEX enum_base_category_value_key ON "enum" (category, value)
  WHERE tenant_id IS NULL AND project_id IS NULL AND module_id IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX enum_tenant_category_value_key ON "enum" (tenant_id, category, value)
  WHERE tenant_id IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX enum_project_category_value_key ON "enum" (project_id, category, value)
  WHERE project_id IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX enum_module_category_value_key ON "enum" (module_id, category, value)
  WHERE module_id IS NOT NULL;