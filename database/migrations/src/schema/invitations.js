"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitations = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const tenants_1 = require("./tenants");
const users_1 = require("./users");
exports.invitations = (0, pg_core_1.pgTable)('invitations', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    tenantId: (0, pg_core_1.uuid)('tenant_id')
        .notNull()
        .references(() => tenants_1.tenants.id, { onDelete: 'cascade' }),
    email: (0, pg_core_1.text)('email').notNull(),
    role: (0, pg_core_1.text)('role').notNull(),
    invitedBy: (0, pg_core_1.uuid)('invited_by')
        .notNull()
        .references(() => users_1.users.id),
    token: (0, pg_core_1.text)('token').notNull().unique(),
    status: (0, pg_core_1.text)('status').notNull().default('pending'),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
//# sourceMappingURL=invitations.js.map