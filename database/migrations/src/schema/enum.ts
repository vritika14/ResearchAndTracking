import { pgTable, uuid, text, integer, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const enumTable = pgTable(
  'enum',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    category: text('category').notNull(),
    value: text('value').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueCategoryValue: uniqueIndex('enum_category_value_key').on(
      table.category,
      table.value,
    ),
  }),
);
