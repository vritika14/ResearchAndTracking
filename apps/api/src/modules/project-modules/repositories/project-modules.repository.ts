import { Injectable } from '@nestjs/common';
import { modules } from '@research-tracker/migrations';
import { and, eq, isNull, sql } from 'drizzle-orm';
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
    const isoCheck = await this.drizzle.db.execute(sql`SHOW transaction_isolation`);
    console.log('DEBUG - isolation level:', isoCheck.rows[0]);
  
    const xactCheck = await this.drizzle.db.execute(sql`SELECT pg_current_xact_id_if_assigned() as xact_id`);
    console.log('DEBUG - xact id before insert:', xactCheck.rows[0]);
  
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
