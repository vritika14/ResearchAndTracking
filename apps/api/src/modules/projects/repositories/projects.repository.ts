import { Injectable } from '@nestjs/common';
import {
  enumTable,
  projectCollaborators,
  projects,
} from '@research-tracker/migrations';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
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

  /** Tenant-agnostic single-project fetch, used to resolve a project's own tenant. */
  async findByIdGlobal(projectId: string) {
    const [project] = await this.drizzle.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));
    return project;
  }

  /** Tenant-agnostic multi-project fetch, for listing across a caller's collaborations. */
  async findByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return this.drizzle.db
      .select()
      .from(projects)
      .where(inArray(projects.id, ids));
  }

  async findActiveByTenant(tenantId: string, offset: number, limit: number) {
    const [data, countResult] = await Promise.all([
      this.drizzle.db
        .select()
        .from(projects)
        .where(
          and(eq(projects.tenantId, tenantId), isNull(projects.archivedAt)),
        )
        .limit(limit)
        .offset(offset),
      this.drizzle.db
        .select({ count: sql<number>`count(*)::int` })
        .from(projects)
        .where(
          and(eq(projects.tenantId, tenantId), isNull(projects.archivedAt)),
        ),
    ]);
    return { data, totalItems: countResult[0]?.count ?? 0 };
  }

  async create(
    values: {
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
      displayId?: string;
    },
    ownerRoleId: string,
    pipelineStages?: string[],
    initialPipelineStage?: string,
  ) {
    let [project] = await this.drizzle.db
      .insert(projects)
      .values(values)
      .returning();

    if (!project) {
      return undefined;
    }
    const projectId = project.id;

    if (pipelineStages?.length) {
      const stageRows = await this.drizzle.db
        .insert(enumTable)
        .values(
          pipelineStages.map((value, index) => ({
            projectId,
            category: 'project_pipeline_stage',
            value,
            sortOrder: index + 1,
          })),
        )
        .returning();
      const initialStage =
        stageRows.find((stage) => stage.value === initialPipelineStage) ??
        stageRows[0];
      if (initialStage) {
        const [updatedProject] = await this.drizzle.db
          .update(projects)
          .set({ pipelineStageId: initialStage.id, updatedAt: new Date() })
          .where(eq(projects.id, projectId))
          .returning();
        if (updatedProject) project = updatedProject;
      }
    }

    await this.drizzle.db.insert(projectCollaborators).values({
      tenantId: values.tenantId,
      projectId,
      userId: values.userId,
      roleId: ownerRoleId,
    });

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
