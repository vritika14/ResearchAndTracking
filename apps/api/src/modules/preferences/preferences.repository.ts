import { Injectable } from '@nestjs/common';
import {
  userPreferences,
  userWorkspacePreferences,
  type AccountPreferenceValues,
  type WorkspacePreferenceValues,
} from '@research-tracker/migrations';
import { and, eq, sql } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';

@Injectable()
export class PreferencesRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findAccount(userId: string) {
    const [row] = await this.drizzle.db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return row;
  }

  async updateAccount(userId: string, patch: AccountPreferenceValues) {
    const patchJson = JSON.stringify(patch);
    const [row] = await this.drizzle.db
      .insert(userPreferences)
      .values({ userId, preferences: patch })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          preferences: sql`${userPreferences.preferences} || ${patchJson}::jsonb`,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row;
  }

  async findWorkspace(userId: string, tenantId: string) {
    const [row] = await this.drizzle.db
      .select()
      .from(userWorkspacePreferences)
      .where(
        and(
          eq(userWorkspacePreferences.userId, userId),
          eq(userWorkspacePreferences.tenantId, tenantId),
        ),
      );
    return row;
  }

  async updateWorkspace(
    userId: string,
    tenantId: string,
    patch: WorkspacePreferenceValues,
  ) {
    const topLevelPatch = patch.dashboardLayout
      ? { dashboardLayout: patch.dashboardLayout }
      : {};
    const topLevelJson = JSON.stringify(topLevelPatch);
    const tableColumnsJson = JSON.stringify(patch.tableColumns ?? {});
    const pipelineHiddenStagesJson = JSON.stringify(
      patch.pipelineHiddenStages ?? {},
    );
    const [row] = await this.drizzle.db
      .insert(userWorkspacePreferences)
      .values({ userId, tenantId, preferences: patch })
      .onConflictDoUpdate({
        target: [
          userWorkspacePreferences.userId,
          userWorkspacePreferences.tenantId,
        ],
        set: {
          preferences: sql`
            ${userWorkspacePreferences.preferences}
            || ${topLevelJson}::jsonb
            || jsonb_build_object(
              'tableColumns',
              COALESCE(${userWorkspacePreferences.preferences}->'tableColumns', '{}'::jsonb)
              || ${tableColumnsJson}::jsonb
            )
            || jsonb_build_object(
              'pipelineHiddenStages',
              COALESCE(${userWorkspacePreferences.preferences}->'pipelineHiddenStages', '{}'::jsonb)
              || ${pipelineHiddenStagesJson}::jsonb
            )
          `,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row;
  }
}
