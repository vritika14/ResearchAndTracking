import { Injectable } from '@nestjs/common';
import { enumTable, modules } from '@research-tracker/migrations';
import { and, eq, inArray, isNull } from 'drizzle-orm';
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

  async findActiveByTenant(tenantId: string, projectId?: string) {
    const conditions = [
      eq(modules.tenantId, tenantId),
      isNull(modules.archivedAt),
    ];
    if (projectId) {
      conditions.push(eq(modules.projectId, projectId));
    }
    return this.drizzle.db
      .select()
      .from(modules)
      .where(and(...conditions));
  }

  async create(
    values: {
      projectId?: string;
      tenantId: string;
      title: string;
      description?: string;
      tagId?: string;
      statusId?: string;
      pipelineStageId?: string;
      assignedToUserId?: string;
      displayId?: string;
    },
    pipelineStages?: string[],
    initialPipelineStage?: string,
  ) {
    let [module] = await this.drizzle.db
      .insert(modules)
      .values(values)
      .returning();
    if (!module || !pipelineStages?.length) return module;

    const stageRows = await this.drizzle.db
      .insert(enumTable)
      .values(
        pipelineStages.map((value, index) => ({
          moduleId: module!.id,
          category: 'module_pipeline_stage',
          value,
          sortOrder: index + 1,
        })),
      )
      .returning();

    const initialStage =
      stageRows.find((stage) => stage.value === initialPipelineStage) ??
      stageRows[0];

    if (initialStage) {
      [module] = await this.drizzle.db
        .update(modules)
        .set({ pipelineStageId: initialStage.id, updatedAt: new Date() })
        .where(eq(modules.id, module.id))
        .returning();
    }

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
