// database/migrations/src/schema/tenant-sequences.ts
import { pgTable, uuid, text, integer, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const tenantSequences = pgTable(
  'tenant_sequences',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    entityType: text('entity_type').notNull(),
    lastValue: integer('last_value').default(0).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueTenantEntity: uniqueIndex('tenant_sequences_tenant_id_entity_type_key').on(
      table.tenantId,
      table.entityType,
    ),
  }),
);
