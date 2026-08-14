import { Injectable } from '@nestjs/common';
import { modules } from '@research-tracker/migrations';
import { and, eq, isNull } from 'drizzle-orm';
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

  async findActiveByProject(tenantId: string, projectId: string) {
    return this.drizzle.db
      .select()
      .from(modules)
      .where(
        and(
          eq(modules.tenantId, tenantId),
          eq(modules.projectId, projectId),
          isNull(modules.archivedAt),
        ),
      );
  }

  async create(values: {
    projectId: string;
    tenantId: string;
    title: string;
    description?: string;
    tagId?: string;
    statusId?: string;
    assignedToUserId?: string;
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
