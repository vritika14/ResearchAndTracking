import {
    pgTable,
    uuid,
    timestamp,
    uniqueIndex,
    index,
  } from 'drizzle-orm/pg-core';
  import { conferences } from './conferences';
  import { projects } from './projects';
  import { tenants } from './tenants';
  
  export const conferenceProjects = pgTable(
    'conference_projects',
    {
      id: uuid('id').defaultRandom().primaryKey(),
  
      tenantId: uuid('tenant_id')
        .notNull()
        .references(() => tenants.id, { onDelete: 'cascade' }),
  
      conferenceId: uuid('conference_id')
        .notNull()
        .references(() => conferences.id, { onDelete: 'cascade' }),
  
      projectId: uuid('project_id')
        .notNull()
        .references(() => projects.id, { onDelete: 'cascade' }),
  
      createdAt: timestamp('created_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
    },
    (table) => ({
      uniqueConferenceProject: uniqueIndex(
        'conference_projects_conference_id_project_id_key',
      ).on(table.conferenceId, table.projectId),
  
      projectIdx: index('conference_projects_project_id_idx').on(
        table.projectId,
      ),
  
      tenantIdx: index('conference_projects_tenant_id_idx').on(table.tenantId),
    }),
  );