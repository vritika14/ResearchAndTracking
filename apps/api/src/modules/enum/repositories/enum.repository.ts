// apps/api/src/modules/enum/repositories/enum.repository.ts
import { Injectable } from '@nestjs/common';
import { enumTable } from '@research-tracker/migrations';
import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { DrizzleService } from '../../../db/drizzle.service';

@Injectable()
export class EnumRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByCategory(category: string) {
    return this.drizzle.db
      .select()
      .from(enumTable)
      .where(
        and(
          eq(enumTable.category, category),
          isNull(enumTable.projectId),
          isNull(enumTable.moduleId),
        ),
      )
      .orderBy(asc(enumTable.sortOrder));
  }

  async findByCategoryAndValue(category: string, value: string) {
    const [result] = await this.drizzle.db
      .select()
      .from(enumTable)
      .where(and(eq(enumTable.category, category), eq(enumTable.value, value)));
    return result;
  }

  async findValuesByIds(ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();
    const rows = await this.drizzle.db
      .select({ id: enumTable.id, value: enumTable.value })
      .from(enumTable)
      .where(inArray(enumTable.id, ids));
    return new Map(rows.map((row) => [row.id, row.value]));
  }

  // ============================================================
  // Project-scoped pipeline stages
  // ============================================================

  async findPipelineStagesForProject(projectId: string) {
    const scopedStages = await this.drizzle.db
      .select()
      .from(enumTable)
      .where(
        and(
          eq(enumTable.category, 'project_pipeline_stage'),
          eq(enumTable.projectId, projectId),
        ),
      )
      .orderBy(asc(enumTable.sortOrder));
    if (scopedStages.length) return scopedStages;
    return this.findByCategory('project_pipeline_stage');
  }

  async findPipelineStageForProjectByValue(projectId: string, value: string) {
    const stages = await this.findPipelineStagesForProject(projectId);
    return stages.find((stage) => stage.value === value);
  }

  async createProjectPipelineStage(
    projectId: string,
    value: string,
    sortOrder: number,
  ) {
    const [row] = await this.drizzle.db
      .insert(enumTable)
      .values({
        projectId,
        category: 'project_pipeline_stage',
        value,
        sortOrder,
      })
      .returning();
    return row;
  }

  async updateProjectPipelineStage(
    projectId: string,
    id: string,
    values: Partial<{ value: string; sortOrder: number }>,
  ) {
    const [row] = await this.drizzle.db
      .update(enumTable)
      .set({ ...values, updatedAt: new Date() })
      .where(
        and(
          eq(enumTable.id, id),
          eq(enumTable.projectId, projectId),
          eq(enumTable.category, 'project_pipeline_stage'),
        ),
      )
      .returning();
    return row;
  }

  async deleteProjectPipelineStage(projectId: string, id: string) {
    const [row] = await this.drizzle.db
      .delete(enumTable)
      .where(
        and(
          eq(enumTable.id, id),
          eq(enumTable.projectId, projectId),
          eq(enumTable.category, 'project_pipeline_stage'),
        ),
      )
      .returning();
    return row;
  }

  // ============================================================
  // Module-scoped pipeline stages
  // ============================================================

  async findPipelineStagesForModule(moduleId: string) {
    const scopedStages = await this.drizzle.db
      .select()
      .from(enumTable)
      .where(
        and(
          eq(enumTable.category, 'module_pipeline_stage'),
          eq(enumTable.moduleId, moduleId),
        ),
      )
      .orderBy(asc(enumTable.sortOrder));
    if (scopedStages.length) return scopedStages;
    return this.findByCategory('module_pipeline_stage');
  }

  async findPipelineStageForModuleByValue(moduleId: string, value: string) {
    const stages = await this.findPipelineStagesForModule(moduleId);
    return stages.find((stage) => stage.value === value);
  }

  async createModulePipelineStage(
    moduleId: string,
    value: string,
    sortOrder: number,
  ) {
    const [row] = await this.drizzle.db
      .insert(enumTable)
      .values({ moduleId, category: 'module_pipeline_stage', value, sortOrder })
      .returning();
    return row;
  }

  async updateModulePipelineStage(
    moduleId: string,
    id: string,
    values: Partial<{ value: string; sortOrder: number }>,
  ) {
    const [row] = await this.drizzle.db
      .update(enumTable)
      .set({ ...values, updatedAt: new Date() })
      .where(
        and(
          eq(enumTable.id, id),
          eq(enumTable.moduleId, moduleId),
          eq(enumTable.category, 'module_pipeline_stage'),
        ),
      )
      .returning();
    return row;
  }

  async deleteModulePipelineStage(moduleId: string, id: string) {
    const [row] = await this.drizzle.db
      .delete(enumTable)
      .where(
        and(
          eq(enumTable.id, id),
          eq(enumTable.moduleId, moduleId),
          eq(enumTable.category, 'module_pipeline_stage'),
        ),
      )
      .returning();
    return row;
  }
}
