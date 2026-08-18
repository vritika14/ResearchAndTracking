// apps/api/src/modules/project-collaborators/project-collaborators.module.ts
import { Module } from '@nestjs/common';
import { EnumModule } from '../enum/enum.module';
import { ProjectCollaboratorsController } from './controllers/project-collaborators.controller';
import { ProjectCollaboratorsRepository } from './repositories/project-collaborators.repository';
import { ProjectCollaboratorsService } from './services/project-collaborators.service';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [EnumModule,MembershipsModule],
  controllers: [ProjectCollaboratorsController],
  providers: [ProjectCollaboratorsService, ProjectCollaboratorsRepository],
  exports: [ProjectCollaboratorsRepository],
})
export class ProjectCollaboratorsModule {}
