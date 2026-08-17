// apps/api/src/modules/projects/projects.module.ts
import { Module } from '@nestjs/common';
import { EnumModule } from '../enum/enum.module';
import { UsersModule } from '../users/users.module';
import { ProjectCollaboratorsModule } from '../project-collaborators/project-collaborators.module';
import { TenantSequencesModule } from '../tenant-sequences/tenant-sequences.module';
import { ProjectsController } from './controllers/projects.controller';
import { ProjectsRepository } from './repositories/projects.repository';
import { ProjectsService } from './services/projects.service';

@Module({
  imports: [
    UsersModule,
    EnumModule,
    ProjectCollaboratorsModule,
    TenantSequencesModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectsRepository],
})
export class ProjectsModule {}
