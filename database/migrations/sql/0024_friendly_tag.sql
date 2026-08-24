ALTER TABLE "projects" DROP CONSTRAINT "projects_display_id_unique";--> statement-breakpoint
ALTER TABLE "modules" DROP CONSTRAINT "modules_display_id_unique";--> statement-breakpoint
ALTER TABLE "notes" DROP CONSTRAINT "notes_display_id_unique";--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_display_id_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "projects_tenant_id_display_id_key" ON "projects" USING btree ("tenant_id","display_id");--> statement-breakpoint
CREATE UNIQUE INDEX "modules_tenant_id_display_id_key" ON "modules" USING btree ("tenant_id","display_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notes_tenant_id_display_id_key" ON "notes" USING btree ("tenant_id","display_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_tenant_id_display_id_key" ON "tasks" USING btree ("tenant_id","display_id");