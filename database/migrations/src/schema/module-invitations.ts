// database/migrations/src/schema/module-invitations.ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { modules } from './modules';
import { users } from './users';

export const moduleInvitations = pgTable('module_invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  moduleId: uuid('module_id')
    .notNull()
    .references(() => modules.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').notNull(),
  invitedBy: uuid('invited_by')
    .notNull()
    .references(() => users.id),
  token: text('token').notNull().unique(),
  status: text('status').notNull().default('pending'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
