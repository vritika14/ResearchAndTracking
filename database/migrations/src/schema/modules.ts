import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { tenants } from './tenants';
import { users } from './users';
import { enumTable } from './enum';

export const modules = pgTable('modules', {
  id: uuid('id').defaultRandom().primaryKey(),
  displayId: text('display_id').unique(),
  projectId: uuid('project_id')
    .references(() => projects.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  tagId: uuid('tag_id').references(() => enumTable.id),
  statusId: uuid('status_id').references(() => enumTable.id),
  assignedToUserId: uuid('assigned_to_user_id').references(() => users.id),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
