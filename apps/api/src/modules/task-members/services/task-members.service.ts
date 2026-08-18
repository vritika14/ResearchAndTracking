// apps/api/src/modules/task-members/services/task-members.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TaskMembersRepository } from '../repositories/task-members.repository';

@Injectable()
export class TaskMembersService {
  constructor(private readonly repository: TaskMembersRepository) {}

  async list(tenantId: string, taskId: string) {
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
