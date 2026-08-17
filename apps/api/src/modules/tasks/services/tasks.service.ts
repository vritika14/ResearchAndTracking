// apps/api/src/modules/tasks/services/tasks.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { EnumRepository } from '../../enum/repositories/enum.repository';
import { TasksRepository } from '../repositories/tasks.repository';

@Injectable()
export class TasksService {
  constructor(
    private readonly repository: TasksRepository,
    private readonly enumRepository: EnumRepository,
  ) {}

  async listByProject(tenantId: string, projectId: string) {
    const rows = await this.repository.findByProject(tenantId, projectId);
    return this.withDisplayValues(rows);
  }

  async findOne(tenantId: string, taskId: string) {
    const task = await this.repository.findById(tenantId, taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    const [shaped] = await this.withDisplayValues([task]);
    return shaped;
  }

  async create(
    projectId: string,
    tenantId: string,
    createdBy: string,
    input: {
      moduleId?: string;
      title: string;
      description?: string;
      status?: string;
      priority?: string;
      workingWith?: string;
      estimatedHours?: string;
      dueDate?: string;
    },
  ) {
    const [statusId, priorityId] = await Promise.all([
      this.resolveEnum('task_status', input.status),
      this.resolveEnum('importance', input.priority),
    ]);

    const task = await this.repository.create({
      projectId,
      tenantId,
      moduleId: input.moduleId,
      createdBy,
      title: input.title,
      description: input.description,
      statusId,
      priorityId,
      workingWith: input.workingWith,
      estimatedHours: input.estimatedHours,
      dueDate: input.dueDate,
    });

    if (!task) {
      throw new NotFoundException('Failed to create task');
    }

    const [shaped] = await this.withDisplayValues([task]);
    return shaped;
  }

  async update(
    tenantId: string,
    taskId: string,
    input: Partial<{
      title: string;
      description: string;
      status: string;
      priority: string;
      workingWith: string;
      estimatedHours: string;
      dueDate: string;
    }>,
  ) {
    await this.findOne(tenantId, taskId);

    const [statusId, priorityId] = await Promise.all([
      input.status ? this.resolveEnum('task_status', input.status) : undefined,
      input.priority ? this.resolveEnum('importance', input.priority) : undefined,
    ]);

    const task = await this.repository.update(tenantId, taskId, {
      title: input.title,
      description: input.description,
      statusId,
      priorityId,
      workingWith: input.workingWith,
      estimatedHours: input.estimatedHours,
      dueDate: input.dueDate,
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const [shaped] = await this.withDisplayValues([task]);
    return shaped;
  }

  async delete(tenantId: string, taskId: string) {
    const task = await this.repository.delete(tenantId, taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  private async withDisplayValues<
    T extends { statusId: string | null; priorityId: string | null },
  >(rows: T[]) {
    const ids = rows
      .flatMap((r) => [r.statusId, r.priorityId])
      .filter((id): id is string => id !== null);

    const valuesById = await this.enumRepository.findValuesByIds(ids);

    return rows.map(({ statusId, priorityId, ...rest }) => ({
      ...rest,
      status: statusId ? (valuesById.get(statusId) ?? null) : null,
      priority: priorityId ? (valuesById.get(priorityId) ?? null) : null,
    }));
  }

  private async resolveEnum(category: string, value?: string): Promise<string | undefined> {
    if (!value) return undefined;
    const match = await this.enumRepository.findByCategoryAndValue(category, value);
    if (!match) {
      throw new NotFoundException(`Unknown ${category} value: "${value}"`);
    }
    return match.id;
  }
}
