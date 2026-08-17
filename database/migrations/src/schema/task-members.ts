// database/migrations/src/schema/task-members.ts
import { pgTable, uuid, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { tasks } from './tasks';
import { tenants } from './tenants';
import { users } from './users';

export const taskMembers = pgTable(
  'task_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueTaskUser: uniqueIndex('task_members_task_id_user_id_key').on(table.taskId, table.userId),
  }),
);
