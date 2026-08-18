// apps/api/src/modules/projects/project.module.ts
import { Module } from '@nestjs/common';
import { EnumModule } from '../enum/enum.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { UsersModule } from '../users/users.module';
import { ProjectCollaboratorsModule } from '../project-collaborators/project-collaborators.module';
import { TenantSequencesModule } from '../tenant-sequences/tenant-sequences.module';
import { ProjectsController } from './controllers/projects.controller';
import { ProjectAccessGuard } from './policies/project-access.guard';
import { ProjectsRepository } from './repositories/projects.repository';
import { ProjectsService } from './services/projects.service';

@Module({
  imports: [UsersModule, EnumModule, ProjectCollaboratorsModule, TenantSequencesModule, MembershipsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectsRepository, ProjectAccessGuard],
})
export class ProjectsModule {}
