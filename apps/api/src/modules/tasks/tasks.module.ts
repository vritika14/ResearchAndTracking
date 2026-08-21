import { Module, forwardRef } from '@nestjs/common';
import { EnumModule } from '../enum/enum.module';
import { ProjectModulesModule } from '../project-modules/project-modules.module';
import { TaskMembersModule } from '../task-members/task-members.module';
import { UsersModule } from '../users/users.module';
import { TasksController } from './controllers/tasks.controller';
import { TasksRepository } from './repositories/tasks.repository';
import { TasksService } from './services/tasks.service';
import { TenantSequencesModule } from '../tenant-sequences/tenant-sequences.module';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [
    UsersModule,
    EnumModule,
    TenantSequencesModule,
    forwardRef(() => TaskMembersModule),
    ProjectModulesModule,
    MembershipsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, TasksRepository],
  exports: [TasksRepository],
})
export class TasksModule {}
