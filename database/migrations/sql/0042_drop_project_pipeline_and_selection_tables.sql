ALTER TABLE "project_pipeline_selections" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "module_pipeline_selections" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "project_pipeline_selections" CASCADE;--> statement-breakpoint
DROP TABLE "module_pipeline_selections" CASCADE;--> statement-breakpoint
ALTER TABLE "projects" DROP CONSTRAINT "projects_pipeline_stage_id_enum_id_fk";
--> statement-breakpoint
ALTER TABLE "enum" ADD COLUMN "hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "pipeline_stage_id";