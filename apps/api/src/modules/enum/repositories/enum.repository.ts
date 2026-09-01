// apps/api/src/modules/enum/repositories/enum.repository.ts
import { Injectable } from '@nestjs/common';
import { enumTable } from '@research-tracker/migrations';
import { and, asc, eq, inArray, isNull, or } from 'drizzle-orm';
import { DrizzleService } from '../../../db/drizzle.service';

@Injectable()
export class EnumRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  /**
   * `tenantId` scopes the pool to shared system defaults (tenantId IS NULL)
   * plus this tenant's own custom additions. Omitting it keeps the old
   * behavior (defaults only) — safe for categories that never get
   * tenant-scoped rows (status, importance, role, etc.).
   */
  async findByCategory(category: string, tenantId?: string) {
    return this.drizzle.db
      .select()
      .from(enumTable)
      .where(
        and(
          eq(enumTable.category, category),
          isNull(enumTable.projectId),
          isNull(enumTable.moduleId),
          tenantId
            ? or(isNull(enumTable.tenantId), eq(enumTable.tenantId, tenantId))
            : isNull(enumTable.tenantId),
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
    const baseStages = await this.drizzle.db
      .select()
      .from(enumTable)
      .where(
        and(
          eq(enumTable.category, 'project_pipeline_stage'),
          isNull(enumTable.projectId),
          isNull(enumTable.tenantId),
        ),
      )
      .orderBy(asc(enumTable.sortOrder));
  
    const customStages = await this.drizzle.db
      .select()
      .from(enumTable)
      .where(
        and(
          eq(enumTable.category, 'project_pipeline_stage'),
          eq(enumTable.projectId, projectId),
        ),
      )
      .orderBy(asc(enumTable.sortOrder));
  
    return { baseStages, customStages };
  }

  async findPipelineStageForProjectByValue(projectId: string, value: string) {
    const { baseStages, customStages } =
      await this.findPipelineStagesForProject(projectId);
    return [...baseStages, ...customStages].find(
      (stage) => stage.value === value,
    );
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
    const baseStages = await this.drizzle.db
      .select()
      .from(enumTable)
      .where(
        and(
          eq(enumTable.category, 'module_pipeline_stage'),
          isNull(enumTable.moduleId),
          isNull(enumTable.tenantId),
          isNull(enumTable.projectId),
        ),
      )
      .orderBy(asc(enumTable.sortOrder));

    const customStages = await this.drizzle.db
      .select()
      .from(enumTable)
      .where(
        and(
          eq(enumTable.category, 'module_pipeline_stage'),
          eq(enumTable.moduleId, moduleId),
        ),
      )
      .orderBy(asc(enumTable.sortOrder));

    return { baseStages, customStages };
  }

  async findPipelineStageForModuleByValue(moduleId: string, value: string) {
    const { baseStages, customStages } =
      await this.findPipelineStagesForModule(moduleId);
    return [...baseStages, ...customStages].find(
      (stage) => stage.value === value,
    );
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

  // ============================================================
  // Tenant-wide pipeline stage pools (used for both
  // 'project_pipeline_stage' and 'module_pipeline_stage')
  // ============================================================

  async createTenantPipelineStage(
    tenantId: string,
    category: string,
    value: string,
    sortOrder: number,
  ) {
    const [row] = await this.drizzle.db
      .insert(enumTable)
      .values({ tenantId, category, value, sortOrder })
      .returning();
    return row;
  }

  /**
   * Makes sure every one of `values` exists in this tenant's shared stage
   * pool, appending any that are missing after the current highest
   * sortOrder. Called when a project/module is created with a custom stage
   * list, so a brand-new stage name typed at creation time immediately
   * shows up in the tenant-wide Pipeline view too — not just on that one
   * project/module's own pipeline.
   */
  async ensureTenantPipelineStages(
    tenantId: string,
    category: string,
    values: string[],
  ) {
    if (values.length === 0) return;
    const existing = await this.findByCategory(category, tenantId);
    const existingValues = new Set(existing.map((stage) => stage.value));
    const missing = values.filter((value) => !existingValues.has(value));
    if (missing.length === 0) return;

    let nextSortOrder =
      existing.reduce((max, stage) => Math.max(max, stage.sortOrder), 0) + 1;
    for (const value of missing) {
      await this.createTenantPipelineStage(
        tenantId,
        category,
        value,
        nextSortOrder,
      );
      nextSortOrder += 1;
    }
  }

  /** Only matches rows this tenant owns — the shared defaults (tenantId IS NULL) are never editable here. */
  async updateTenantPipelineStage(
    tenantId: string,
    category: string,
    id: string,
    values: Partial<{ value: string; sortOrder: number }>,
  ) {
    const [row] = await this.drizzle.db
      .update(enumTable)
      .set({ ...values, updatedAt: new Date() })
      .where(
        and(
          eq(enumTable.id, id),
          eq(enumTable.tenantId, tenantId),
          eq(enumTable.category, category),
        ),
      )
      .returning();
    return row;
  }

  async deleteTenantPipelineStage(
    tenantId: string,
    category: string,
    id: string,
  ) {
    const [row] = await this.drizzle.db
      .delete(enumTable)
      .where(
        and(
          eq(enumTable.id, id),
          eq(enumTable.tenantId, tenantId),
          eq(enumTable.category, category),
        ),
      )
      .returning();
    return row;
  }
}
