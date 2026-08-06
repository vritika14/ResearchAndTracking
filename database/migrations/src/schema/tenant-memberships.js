"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantMemberships = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
const tenants_1 = require("./tenants");
exports.tenantMemberships = (0, pg_core_1.pgTable)('tenant_memberships', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    tenantId: (0, pg_core_1.uuid)('tenant_id')
        .notNull()
        .references(() => tenants_1.tenants.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    role: (0, pg_core_1.text)('role').notNull(),
    status: (0, pg_core_1.text)('status').default('active').notNull(),
    invietedAt: (0, pg_core_1.timestamp)('invited_at', { withTimezone: true }).defaultNow().notNull(),
    joinedAt: (0, pg_core_1.timestamp)('joined_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    uniqueTenantUser: (0, pg_core_1.uniqueIndex)('tenant_memberships_tenant_id_user_id_key').on(table.tenantId, table.userId),
}));
//# sourceMappingURL=tenant-memberships.js.map