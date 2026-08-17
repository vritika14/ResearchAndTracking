import { Injectable } from '@nestjs/common';
import { notes } from '@research-tracker/migrations';
import { and, eq } from 'drizzle-orm';
import { DrizzleService } from '../../../db/drizzle.service';

@Injectable()
export class NotesRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findById(tenantId: string, noteId: string) {
    const [note] = await this.drizzle.db
      .select()
      .from(notes)
      .where(and(eq(notes.tenantId, tenantId), eq(notes.id, noteId)));
    return note;
  }

  async findByTenant(tenantId: string, projectId?: string) {
    const conditions = [eq(notes.tenantId, tenantId)];
    if (projectId) {
      conditions.push(eq(notes.projectId, projectId));
    }
    return this.drizzle.db
      .select()
      .from(notes)
      .where(and(...conditions));
  }

  async create(values: {
    projectId?: string;
    tenantId: string;
    moduleId?: string;
    createdBy: string;
    title: string;
    content?: string;
    displayId?: string;
  }) {
    const [note] = await this.drizzle.db
      .insert(notes)
      .values(values)
      .returning();
    return note;
  }

  async update(
    tenantId: string,
    noteId: string,
    values: Partial<{ title: string; content: string }>,
  ) {
    const [note] = await this.drizzle.db
      .update(notes)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(notes.tenantId, tenantId), eq(notes.id, noteId)))
      .returning();
    return note;
  }

  async delete(tenantId: string, noteId: string) {
    const [note] = await this.drizzle.db
      .delete(notes)
      .where(and(eq(notes.tenantId, tenantId), eq(notes.id, noteId)))
      .returning();
    return note;
  }
}
