// apps/api/src/modules/enum/repositories/enum.repository.ts
import { Injectable } from '@nestjs/common';
import { enumTable } from '@research-tracker/migrations';
import { and, asc, eq, inArray, or, isNull } from 'drizzle-orm';
import { DrizzleService } from '../../../db/drizzle.service';

@Injectable()
export class EnumRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByCategory(category: string) {
    return this.drizzle.db
      .select()
      .from(enumTable)
      .where(eq(enumTable.category, category))
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
    return this.drizzle.db
      .select()
      .from(enumTable)
      .where(
        and(
          eq(enumTable.category, 'project_pipeline_stage'),
          or(isNull(enumTable.projectId), eq(enumTable.projectId, projectId)),
        ),
      )
      .orderBy(asc(enumTable.sortOrder));
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
    return this.drizzle.db
      .select()
      .from(enumTable)
      .where(
        and(
          eq(enumTable.category, 'module_pipeline_stage'),
          or(isNull(enumTable.moduleId), eq(enumTable.moduleId, moduleId)),
        ),
      )
      .orderBy(asc(enumTable.sortOrder));
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
