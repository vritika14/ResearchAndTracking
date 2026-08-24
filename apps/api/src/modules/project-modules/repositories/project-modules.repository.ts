import { Injectable } from '@nestjs/common';
import { modules } from '@research-tracker/migrations';
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

  /** Tenant-agnostic single-module fetch, used to resolve a module's own tenant. */
  async findByIdGlobal(moduleId: string) {
    const [module] = await this.drizzle.db
      .select()
      .from(modules)
      .where(eq(modules.id, moduleId));
    return module;
  }

  /** Tenant-agnostic multi-module fetch, for independent modules the caller collaborates on. */
  async findByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return this.drizzle.db.select().from(modules).where(inArray(modules.id, ids));
  }

  /** Tenant-agnostic multi-module fetch, for modules linked to any of the caller's accessible projects. */
  async findByProjectIds(projectIds: string[]) {
    if (projectIds.length === 0) return [];
    return this.drizzle.db.select().from(modules).where(inArray(modules.projectId, projectIds));
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

  async create(values: {
    projectId?: string;
    tenantId: string;
    title: string;
    description?: string;
    tagId?: string;
    statusId?: string;
    assignedToUserId?: string;
    displayId?: string;
  }) {
    const [module] = await this.drizzle.db
      .insert(modules)
      .values(values)
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
