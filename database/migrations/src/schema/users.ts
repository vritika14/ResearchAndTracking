import { pgTable, uuid, text, timestamp, date } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  fullName: text('full_name'),
  externalAuthId: text('external_auth_id').unique(),
  dateOfBirth: date('date_of_birth'),
  jobTitle: text('job_title'),
  institution: text('institution'),
  department: text('department'),
  phone: text('phone'),
  researchInterests: text('research_interests'),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
