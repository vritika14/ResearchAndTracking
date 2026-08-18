import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnumRepository } from '../../enum/repositories/enum.repository';
import { TaskMembersRepository } from '../../task-members/repositories/task-members.repository';
import { TenantSequencesRepository } from '../../tenant-sequences/repositories/tenant-sequences.repository';
import { TasksRepository } from '../repositories/tasks.repository';

@Injectable()
export class TasksService {
  constructor(
    private readonly repository: TasksRepository,
    private readonly enumRepository: EnumRepository,
    private readonly sequences: TenantSequencesRepository,
    private readonly taskMembers: TaskMembersRepository,
  ) {}

  async list(tenantId: string, projectId?: string) {
    const rows = await this.repository.findByTenant(tenantId, projectId);
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
    tenantId: string,
    createdBy: string,
    input: {
      projectId?: string;
      moduleId?: string;
      title: string;
      description?: string;
      status?: string;
      priority?: string;
      visibility?: string;
      workingWith?: string;
      estimatedHours?: string;
      dueDate?: string;
    },
  ) {
    if (input.moduleId && !input.projectId) {
      throw new BadRequestException(
        'moduleId requires projectId to also be provided',
      );
    }
    const visibilityValue = input.visibility ?? 'Private';
    if (visibilityValue === 'Private' && input.workingWith) {
      throw new BadRequestException(
        'A private task cannot have workingWith set',
      );
    }

    const [statusId, priorityId, visibilityId, displayId] = await Promise.all([
      this.resolveEnum('task_status', input.status),
      this.resolveEnum('importance', input.priority),
      this.resolveEnum('visibility', visibilityValue),
      this.sequences.nextDisplayId(tenantId, 'task'),
    ]);

    const task = await this.repository.create({
      tenantId,
      projectId: input.projectId,
      moduleId: input.moduleId,
      createdBy,
      title: input.title,
      description: input.description,
      statusId,
      priorityId,
      visibilityId,
      workingWith: input.workingWith,
      estimatedHours: input.estimatedHours,
      dueDate: input.dueDate,
      displayId,
    });

    if (!task) {
      throw new NotFoundException('Failed to create task');
    }
    if (visibilityValue === 'Shared') {
      await this.taskMembers.create({
        tenantId,
        taskId: task.id,
        userId: createdBy,
      });
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
      visibility: string;
      workingWith: string;
      estimatedHours: string;
      dueDate: string;
    }>,
  ) {
    const existing = await this.findOne(tenantId, taskId);
    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    if (input.visibility === 'Private' && input.workingWith) {
      throw new BadRequestException(
        'A private task cannot have workingWith set',
      );
    }

    const [statusId, priorityId, visibilityId] = await Promise.all([
      input.status ? this.resolveEnum('task_status', input.status) : undefined,
      input.priority
        ? this.resolveEnum('importance', input.priority)
        : undefined,
      input.visibility
        ? this.resolveEnum('visibility', input.visibility)
        : undefined,
    ]);

    const task = await this.repository.update(tenantId, taskId, {
      title: input.title,
      description: input.description,
      statusId,
      priorityId,
      visibilityId,
      workingWith: input.visibility === 'Private' ? null : input.workingWith,
      estimatedHours: input.estimatedHours,
      dueDate: input.dueDate,
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }
    if (input.visibility === 'Private') {
      await this.taskMembers.deleteAllForTask(tenantId, taskId);
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
    T extends {
      statusId: string | null;
      priorityId: string | null;
      visibilityId: string | null;
    },
  >(rows: T[]) {
    const ids = rows
      .flatMap((r) => [r.statusId, r.priorityId, r.visibilityId])
      .filter((id): id is string => id !== null);

    const valuesById = await this.enumRepository.findValuesByIds(ids);

    return rows.map(({ statusId, priorityId, visibilityId, ...rest }) => ({
      ...rest,
      status: statusId ? (valuesById.get(statusId) ?? null) : null,
      priority: priorityId ? (valuesById.get(priorityId) ?? null) : null,
      visibility: visibilityId ? (valuesById.get(visibilityId) ?? null) : null,
    }));
  }

  private async resolveEnum(
    category: string,
    value?: string,
  ): Promise<string | undefined> {
    if (!value) return undefined;
    const match = await this.enumRepository.findByCategoryAndValue(
      category,
      value,
    );
    if (!match) {
      throw new NotFoundException(`Unknown ${category} value: "${value}"`);
    }
    return match.id;
  }
}
