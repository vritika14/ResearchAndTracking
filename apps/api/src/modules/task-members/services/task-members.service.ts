// apps/api/src/modules/task-members/services/task-members.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TasksRepository } from '../../tasks/repositories/tasks.repository';
import { TaskMembersRepository } from '../repositories/task-members.repository';

@Injectable()
export class TaskMembersService {
  constructor(
    private readonly repository: TaskMembersRepository,
    private readonly tasksRepository: TasksRepository,
  ) {}

  /**
   * The member list is itself only visible to someone who can already see
   * the task: its creator, or an existing member.
   */
  async list(tenantId: string, taskId: string, callerUserId: string) {
    const task = await this.tasksRepository.findById(tenantId, taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    const hasAccess =
      task.createdBy === callerUserId ||
      Boolean(
        await this.repository.findByTaskAndUser(tenantId, taskId, callerUserId),
      );
    if (!hasAccess) {
      throw new NotFoundException('Task not found');
    }
    return this.repository.findByTask(tenantId, taskId);
  }

  async add(tenantId: string, taskId: string, userId: string) {
    const existing = await this.repository.findByTaskAndUser(
      tenantId,
      taskId,
      userId,
    );
    if (existing) {
      throw new ConflictException('This user is already a member of this task');
    }
    return this.repository.create({ tenantId, taskId, userId });
  }

  async remove(tenantId: string, taskId: string, userId: string) {
    const row = await this.repository.delete(tenantId, taskId, userId);
    if (!row) {
      throw new NotFoundException('Member not found on this task');
    }
    return row;
  }
}
