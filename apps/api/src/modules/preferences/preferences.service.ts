import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type {
  AccountPreferenceValues,
  DashboardLayoutPreference,
  WorkspacePreferenceValues,
} from '@research-tracker/migrations';
import { UpdateAccountPreferencesDto } from './dto/update-account-preferences.dto';
import { UpdateWorkspacePreferencesDto } from './dto/update-workspace-preferences.dto';
import { PreferencesRepository } from './preferences.repository';

const TABLE_KEYS = new Set([
  'projects',
  'modules',
  'tasks',
  'conferences',
  'dashboard-priority-tasks',
  'dashboard-pipeline',
]);

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter((item): item is string => typeof item === 'string'),
    ),
  ]
    .filter((item) => item.length > 0 && item.length <= 100)
    .slice(0, 100);
}

@Injectable()
export class PreferencesService {
  constructor(private readonly repository: PreferencesRepository) {}

  async getAccount(userId: string) {
    return (await this.repository.findAccount(userId))?.preferences ?? null;
  }

  async updateAccount(userId: string, input: UpdateAccountPreferencesDto) {
    const patch: AccountPreferenceValues = input;
    const updated = await this.repository.updateAccount(userId, patch);
    if (!updated)
      throw new InternalServerErrorException('Preferences could not be saved');
    return updated.preferences;
  }

  async getWorkspace(userId: string, tenantId: string) {
    return (
      (await this.repository.findWorkspace(userId, tenantId))?.preferences ??
      null
    );
  }

  async updateWorkspace(
    userId: string,
    tenantId: string,
    input: UpdateWorkspacePreferencesDto,
  ) {
    const patch: WorkspacePreferenceValues = {};

    if (input.dashboardLayout) {
      const layout: DashboardLayoutPreference = {
        order: stringList(input.dashboardLayout.order),
        hidden: stringList(input.dashboardLayout.hidden),
      };
      patch.dashboardLayout = layout;
    }

    if (input.tableColumns) {
      patch.tableColumns = Object.fromEntries(
        Object.entries(input.tableColumns)
          .filter(([key]) => TABLE_KEYS.has(key))
          .map(([key, value]) => [key, stringList(value)]),
      );
    }

    const updated = await this.repository.updateWorkspace(
      userId,
      tenantId,
      patch,
    );
    if (!updated)
      throw new InternalServerErrorException('Preferences could not be saved');
    return updated.preferences;
  }
}
