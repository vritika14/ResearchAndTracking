// apps/api/src/modules/task-members/task-members.module.ts
import { Module } from '@nestjs/common';
import { TaskMembersController } from './controllers/task-members.controller';
import { TaskMembersRepository } from './repositories/task-members.repository';
import { TaskMembersService } from './services/task-members.service';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  controllers: [TaskMembersController],
  providers: [TaskMembersService, TaskMembersRepository],
  exports: [TaskMembersRepository],
  imports: [MembershipsModule],
})
export class TaskMembersModule {}
