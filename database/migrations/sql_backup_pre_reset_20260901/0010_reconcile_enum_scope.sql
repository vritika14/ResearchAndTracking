DROP INDEX IF EXISTS "enum_category_value_key";--> statement-breakpoint
ALTER TABLE "enum" DROP COLUMN IF EXISTS "tenant_id";--> statement-breakpoint
CREATE UNIQUE INDEX "enum_category_value_key" ON "enum" USING btree ("category", "value");
