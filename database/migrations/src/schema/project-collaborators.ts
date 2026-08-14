import { pgTable, uuid, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { tenants } from './tenants';
import { users } from './users';
import { enumTable } from './enum';

export const projectCollaborators = pgTable(
  'project_collaborators',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => enumTable.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueProjectUser: uniqueIndex('project_collaborators_project_id_user_id_key').on(
      table.projectId,
      table.userId,
    ),
  }),
);
