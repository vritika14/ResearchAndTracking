import { Module } from '@nestjs/common';
import { EnumModule } from '../enum/enum.module';
import { TaskMembersModule } from '../task-members/task-members.module';
import { UsersModule } from '../users/users.module';
import { TasksController } from './controllers/tasks.controller';
import { TasksRepository } from './repositories/tasks.repository';
import { TasksService } from './services/tasks.service';
import { TenantSequencesModule } from '../tenant-sequences/tenant-sequences.module';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [UsersModule, EnumModule, TenantSequencesModule, TaskMembersModule,MembershipsModule],
  controllers: [TasksController],
  providers: [TasksService, TasksRepository],
})
export class TasksModule {}
