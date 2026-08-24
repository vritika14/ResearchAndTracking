import { Injectable } from '@nestjs/common';
import { tasks } from '@research-tracker/migrations';
import { and, eq, inArray } from 'drizzle-orm';
import { DrizzleService } from '../../../db/drizzle.service';

@Injectable()
export class TasksRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findById(tenantId: string, taskId: string) {
    const [task] = await this.drizzle.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.tenantId, tenantId), eq(tasks.id, taskId)));
    return task;
  }

  /** Tenant-agnostic lookup — used for "tasks shared with me" access, where the
   * caller may not be a member of the tenant that owns the task at all. */
  async findByIdGlobal(taskId: string) {
    const [task] = await this.drizzle.db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId));
    return task;
  }

  /** All tasks the given user created, across every tenant. */
  async findByCreator(userId: string) {
    return this.drizzle.db.select().from(tasks).where(eq(tasks.createdBy, userId));
  }

  async findByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return this.drizzle.db.select().from(tasks).where(inArray(tasks.id, ids));
  }

  async findByTenant(tenantId: string, projectId?: string) {
    const conditions = [eq(tasks.tenantId, tenantId)];
    if (projectId) {
      conditions.push(eq(tasks.projectId, projectId));
    }
    return this.drizzle.db
      .select()
      .from(tasks)
      .where(and(...conditions));
  }

  async create(values: {
    tenantId: string;
    projectId?: string;
    moduleId?: string;
    createdBy: string;
    title: string;
    description?: string;
    statusId?: string;
    priorityId?: string;
    visibilityId?: string;
    workingWith?: string;
    estimatedHours?: string;
    dueDate?: string;
    displayId?: string;
  }) {
    const [task] = await this.drizzle.db
      .insert(tasks)
      .values(values)
      .returning();
    return task;
  }

  async update(
    tenantId: string,
    taskId: string,
    values: Partial<{
      title: string;
      description: string;
      statusId: string;
      priorityId: string;
      visibilityId: string;
      workingWith: string | null;
      estimatedHours: string;
      dueDate: string;
      projectId: string | null;
      moduleId: string | null;
    }>,
  ) {
    const [task] = await this.drizzle.db
      .update(tasks)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(tasks.tenantId, tenantId), eq(tasks.id, taskId)))
      .returning();
    return task;
  }

  async delete(tenantId: string, taskId: string) {
    const [task] = await this.drizzle.db
      .delete(tasks)
      .where(and(eq(tasks.tenantId, tenantId), eq(tasks.id, taskId)))
      .returning();
    return task;
  }
}
