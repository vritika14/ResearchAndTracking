// database/migrations/src/schema/note-members.ts
import { pgTable, uuid, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { notes } from './notes';
import { tenants } from './tenants';
import { users } from './users';

export const noteMembers = pgTable(
  'note_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    noteId: uuid('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueNoteUser: uniqueIndex('note_members_note_id_user_id_key').on(table.noteId, table.userId),
  }),
);
