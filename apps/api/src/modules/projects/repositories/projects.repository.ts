import { Injectable } from '@nestjs/common';
import { projects } from '@research-tracker/migrations';
import { and, eq, isNull } from 'drizzle-orm';
import { DrizzleService } from '../../../db/drizzle.service';

@Injectable()
export class ProjectsRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findById(tenantId: string, projectId: string) {
    const [project] = await this.drizzle.db
      .select()
      .from(projects)
      .where(and(eq(projects.tenantId, tenantId), eq(projects.id, projectId)));
    return project;
  }

  async findActiveByTenant(tenantId: string) {
    return this.drizzle.db
      .select()
      .from(projects)
      .where(and(eq(projects.tenantId, tenantId), isNull(projects.archivedAt)));
  }

  async create(values: {
    userId: string;
    tenantId: string;
    title: string;
    description?: string;
    researchArea?: string;
    statusId?: string;
    pipelineStageId?: string;
    importanceId?: string;
    scheduledFor?: string;
    dueDate?: string;
    totalBudget?: string;
    targetJournals?: string;
  }) {
    const [project] = await this.drizzle.db
      .insert(projects)
      .values(values)
      .returning();
    return project;
  }

  async update(
    tenantId: string,
    projectId: string,
    values: Partial<{
      title: string;
      description: string;
      researchArea: string;
      statusId: string;
      pipelineStageId: string;
      importanceId: string;
      scheduledFor: string;
      dueDate: string;
      totalBudget: string;
      targetJournals: string;
    }>,
  ) {
    const [project] = await this.drizzle.db
      .update(projects)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(projects.tenantId, tenantId), eq(projects.id, projectId)))
      .returning();
    return project;
  }

  async archive(tenantId: string, projectId: string, archivedStatusId: string) {
    const [project] = await this.drizzle.db
      .update(projects)
      .set({
        statusId: archivedStatusId,
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(projects.tenantId, tenantId), eq(projects.id, projectId)))
      .returning();
    return project;
  }
}
