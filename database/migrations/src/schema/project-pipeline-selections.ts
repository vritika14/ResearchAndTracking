// database/migrations/src/schema/project-pipeline-selections.ts
import { pgTable, uuid, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { enumTable } from './enum';

export const projectPipelineSelections = pgTable(
  'project_pipeline_selections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    enumId: uuid('enum_id')
      .notNull()
      .references(() => enumTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueProjectEnum: uniqueIndex('project_pipeline_selections_project_id_enum_id_key').on(
      table.projectId,
      table.enumId,
    ),
  }),
);
