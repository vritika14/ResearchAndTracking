import { pgTable, uuid, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { modules } from './modules';
import { projects } from './projects';
import { tenants } from './tenants';
import { users } from './users';
import { enumTable } from './enum';

export const moduleCollaborators = pgTable(
  'module_collaborators',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    moduleId: uuid('module_id')
      .notNull()
      .references(() => modules.id, { onDelete: 'cascade' }),
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
    uniqueModuleUser: uniqueIndex('module_collaborators_module_id_user_id_key').on(
      table.moduleId,
      table.userId,
    ),
  }),
);