// apps/api/src/modules/module-collaborators/repositories/module-collaborators.repository.ts
import { Injectable } from '@nestjs/common';
import { moduleCollaborators } from '@research-tracker/migrations';
import { and, eq } from 'drizzle-orm';
import { DrizzleService } from '../../../db/drizzle.service';

@Injectable()
export class ModuleCollaboratorsRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByModule(tenantId: string, moduleId: string) {
    return this.drizzle.db
      .select()
      .from(moduleCollaborators)
      .where(
        and(
          eq(moduleCollaborators.tenantId, tenantId),
          eq(moduleCollaborators.moduleId, moduleId),
        ),
      );
  }

  async findByModuleAndUser(
    tenantId: string,
    moduleId: string,
    userId: string,
  ) {
    const [row] = await this.drizzle.db
      .select()
      .from(moduleCollaborators)
      .where(
        and(
          eq(moduleCollaborators.tenantId, tenantId),
          eq(moduleCollaborators.moduleId, moduleId),
          eq(moduleCollaborators.userId, userId),
        ),
      );
    return row;
  }

  /** Every independent-module id this user collaborates on, across every tenant. */
  async findModuleIdsByUser(userId: string) {
    const rows = await this.drizzle.db
      .select({ moduleId: moduleCollaborators.moduleId })
      .from(moduleCollaborators)
      .where(eq(moduleCollaborators.userId, userId));
    return rows.map((row) => row.moduleId);
  }

  async create(values: {
    tenantId: string;
    projectId?: string;
    moduleId: string;
    userId: string;
    roleId: string;
  }) {
    const [row] = await this.drizzle.db
      .insert(moduleCollaborators)
      .values(values)
      .returning();
    return row;
  }

  async updateRole(
    tenantId: string,
    moduleId: string,
    userId: string,
    roleId: string,
  ) {
    const [row] = await this.drizzle.db
      .update(moduleCollaborators)
      .set({ roleId, updatedAt: new Date() })
      .where(
        and(
          eq(moduleCollaborators.tenantId, tenantId),
          eq(moduleCollaborators.moduleId, moduleId),
          eq(moduleCollaborators.userId, userId),
        ),
      )
      .returning();
    return row;
  }

  async delete(tenantId: string, moduleId: string, userId: string) {
    const [row] = await this.drizzle.db
      .delete(moduleCollaborators)
      .where(
        and(
          eq(moduleCollaborators.tenantId, tenantId),
          eq(moduleCollaborators.moduleId, moduleId),
          eq(moduleCollaborators.userId, userId),
        ),
      )
      .returning();
    return row;
  }
}
