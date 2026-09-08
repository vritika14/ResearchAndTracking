import { Injectable } from '@nestjs/common';
import {
  enumTable,
  moduleCollaborators,
  modules,
  projectCollaborators,
} from '@research-tracker/migrations';
import { and, desc, eq, exists, inArray, isNull, or, sql } from 'drizzle-orm';
import { DrizzleService } from '../../../db/drizzle.service';

@Injectable()
export class ProjectModulesRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findById(tenantId: string, moduleId: string) {
    const [module] = await this.drizzle.db
      .select()
      .from(modules)
      .where(and(eq(modules.tenantId, tenantId), eq(modules.id, moduleId)));
    return module;
  }

  async findByIdGlobal(moduleId: string) {
    const [module] = await this.drizzle.db
      .select()
      .from(modules)
      .where(eq(modules.id, moduleId));
    return module;
  }

  async findByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return this.drizzle.db
      .select()
      .from(modules)
      .where(inArray(modules.id, ids));
  }

  async findByProjectIds(projectIds: string[]) {
    if (projectIds.length === 0) return [];
    return this.drizzle.db
      .select()
      .from(modules)
      .where(inArray(modules.projectId, projectIds));
  }

  async findVisibleActiveByTenant(
    tenantId: string,
    callerUserId: string,
    offset: number,
    limit: number,
    projectId?: string,
  ) {
    const visibilityCondition = or(
      exists(
        this.drizzle.db
          .select({ id: projectCollaborators.id })
          .from(projectCollaborators)
          .where(
            and(
              eq(projectCollaborators.tenantId, tenantId),
              eq(projectCollaborators.projectId, modules.projectId),
              eq(projectCollaborators.userId, callerUserId),
            ),
          ),
      ),
      and(
        isNull(modules.projectId),
        exists(
          this.drizzle.db
            .select({ id: moduleCollaborators.id })
            .from(moduleCollaborators)
            .where(
              and(
                eq(moduleCollaborators.tenantId, tenantId),
                eq(moduleCollaborators.moduleId, modules.id),
                eq(moduleCollaborators.userId, callerUserId),
              ),
            ),
        ),
      ),
    );

    const conditions = [
      eq(modules.tenantId, tenantId),
      isNull(modules.archivedAt),
      visibilityCondition,
    ];

    if (projectId) {
      conditions.push(eq(modules.projectId, projectId));
    }

    const whereCondition = and(...conditions);

    const [data, countResult] = await Promise.all([
      this.drizzle.db
        .select()
        .from(modules)
        .where(whereCondition)
        .orderBy(desc(modules.createdAt), desc(modules.id))
        .limit(limit)
        .offset(offset),

      this.drizzle.db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(modules)
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
    title: string;
    description?: string;
    tagId?: string;
    statusId?: string;
    pipelineStageId?: string;
    assignedToUserId?: string;
    dueDate?: string;
    displayId?: string;
  }) {
    const [module] = await this.drizzle.db
      .insert(modules)
      .values(values)
      .returning();
    return module;
  }

  /**
   * Pre-context access check for guards. Nest guards execute before the
   * request interceptor establishes app.current_user_id, so ordinary module
   * queries are intentionally hidden by RLS at this point.
   */
  async checkAccessForGuard(
    tenantId: string,
    moduleId: string,
    userId: string,
  ) {
    const result = await this.drizzle.db.execute(
      sql`SELECT check_module_access(${tenantId}::uuid, ${moduleId}::uuid, ${userId}::uuid) AS allowed`,
    );
    return result.rows[0]?.allowed === true;
  }

  async configurePipelineStages(
    moduleId: string,
    pipelineStages: string[],
    initialPipelineStage?: string,
  ) {
    if (pipelineStages.length === 0) {
      return this.findByIdGlobal(moduleId);
    }

    const stageRows = await this.drizzle.db
      .insert(enumTable)
      .values(
        pipelineStages.map((value, index) => ({
          moduleId,
          category: 'module_pipeline_stage',
          value,
          sortOrder: index + 1,
        })),
      )
      .returning();

    const initialStage =
      stageRows.find((stage) => stage.value === initialPipelineStage) ??
      stageRows[0];

    if (!initialStage) {
      return this.findByIdGlobal(moduleId);
    }

    const [module] = await this.drizzle.db
      .update(modules)
      .set({ pipelineStageId: initialStage.id, updatedAt: new Date() })
      .where(eq(modules.id, moduleId))
      .returning();

    return module;
  }

  async update(
    tenantId: string,
    moduleId: string,
    values: Partial<{
      title: string;
      description: string;
      tagId: string;
      statusId: string;
      pipelineStageId: string;
      assignedToUserId: string;
      dueDate: string;
    }>,
  ) {
    const [module] = await this.drizzle.db
      .update(modules)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(modules.tenantId, tenantId), eq(modules.id, moduleId)))
      .returning();
    return module;
  }

  async archive(tenantId: string, moduleId: string, archivedStatusId: string) {
    const [module] = await this.drizzle.db
      .update(modules)
      .set({
        statusId: archivedStatusId,
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(modules.tenantId, tenantId), eq(modules.id, moduleId)))
      .returning();
    return module;
  }
}
