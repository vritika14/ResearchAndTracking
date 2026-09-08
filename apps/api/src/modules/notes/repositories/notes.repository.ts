import { Injectable } from '@nestjs/common';
import { notes, noteMembers } from '@research-tracker/migrations';
import { and, desc, eq, exists, inArray, or, sql } from 'drizzle-orm';
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

  /** Tenant-agnostic lookup — used for "notes shared with me" access, where the
   * caller may not be a member of the tenant that owns the note at all. */
  async findByIdGlobal(noteId: string) {
    const [note] = await this.drizzle.db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId));
    return note;
  }

  /** All notes the given user created, across every tenant. */
  async findByCreator(userId: string) {
    return this.drizzle.db
      .select()
      .from(notes)
      .where(eq(notes.createdBy, userId));
  }

  async findByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return this.drizzle.db.select().from(notes).where(inArray(notes.id, ids));
  }

  async findVisibleByTenant(
    tenantId: string,
    callerUserId: string,
    offset: number,
    limit: number,
    projectId?: string,
  ) {
    const visibilityCondition = or(
      eq(notes.createdBy, callerUserId),
      exists(
        this.drizzle.db
          .select({ id: noteMembers.id })
          .from(noteMembers)
          .where(
            and(
              eq(noteMembers.tenantId, tenantId),
              eq(noteMembers.noteId, notes.id),
              eq(noteMembers.userId, callerUserId),
            ),
          ),
      ),
    );

    const conditions = [eq(notes.tenantId, tenantId), visibilityCondition];

    if (projectId) {
      conditions.push(eq(notes.projectId, projectId));
    }

    const whereCondition = and(...conditions);

    const [data, countResult] = await Promise.all([
      this.drizzle.db
        .select()
        .from(notes)
        .where(whereCondition)
        .orderBy(desc(notes.updatedAt), desc(notes.id))
        .limit(limit)
        .offset(offset),

      this.drizzle.db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(notes)
        .where(whereCondition),
    ]);

    return {
      data,
      totalItems: countResult[0]?.count ?? 0,
    };
  }

  async create(values: {
    projectId?: string;
    tenantId: string;
    moduleId?: string;
    createdBy: string;
    title: string;
    content?: string;
    displayId?: string;
    visibilityId?: string;
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
    values: Partial<{
      title: string;
      content: string;
      visibilityId: string;
      projectId: string | null;
      moduleId: string | null;
    }>,
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
