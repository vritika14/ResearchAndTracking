import { pgTable, uuid, text, integer, timestamp, uniqueIndex, AnyPgColumn } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { projects } from './projects';
import { modules } from './modules';

export const enumTable = pgTable(
  'enum',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id').references((): AnyPgColumn => projects.id, { onDelete: 'cascade' }),
    moduleId: uuid('module_id').references((): AnyPgColumn => modules.id, { onDelete: 'cascade' }),
    category: text('category').notNull(),
    value: text('value').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueScopeCategoryValue: uniqueIndex('enum_scope_category_value_key').on(
      table.tenantId,
      table.projectId,
      table.moduleId,
      table.category,
      table.value,
    ),
  }),
);
