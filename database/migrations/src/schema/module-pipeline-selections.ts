// database/migrations/src/schema/module-pipeline-selections.ts
import { pgTable, uuid, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { modules } from './modules';
import { enumTable } from './enum';

export const modulePipelineSelections = pgTable(
  'module_pipeline_selections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    moduleId: uuid('module_id')
      .notNull()
      .references(() => modules.id, { onDelete: 'cascade' }),
    enumId: uuid('enum_id')
      .notNull()
      .references(() => enumTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueModuleEnum: uniqueIndex('module_pipeline_selections_module_id_enum_id_key').on(
      table.moduleId,
      table.enumId,
    ),
  }),
);