DROP INDEX "enum_category_value_key";--> statement-breakpoint
ALTER TABLE "enum" ADD COLUMN "tenant_id" uuid;--> statement-breakpoint
ALTER TABLE "enum" ADD CONSTRAINT "enum_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "enum_category_value_key" ON "enum" USING btree ("category","value","tenant_id");