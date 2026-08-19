// apps/api/src/modules/task-members/task-members.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TaskMembersController } from './controllers/task-members.controller';
import { TaskMembersRepository } from './repositories/task-members.repository';
import { TaskMembersService } from './services/task-members.service';
import { MembershipsModule } from '../memberships/memberships.module';
import { TasksModule } from '../tasks/tasks.module';
import { UsersModule } from '../users/users.module';

@Module({
  controllers: [TaskMembersController],
  providers: [TaskMembersService, TaskMembersRepository],
  exports: [TaskMembersRepository],
  imports: [MembershipsModule, forwardRef(() => TasksModule), UsersModule],
})
export class TaskMembersModule {}
