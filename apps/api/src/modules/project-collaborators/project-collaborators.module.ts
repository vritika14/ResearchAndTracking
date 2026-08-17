// apps/api/src/modules/project-collaborators/project-collaborators.module.ts
import { Module } from '@nestjs/common';
import { EnumModule } from '../enum/enum.module';
import { ProjectCollaboratorsController } from './controllers/project-collaborators.controller';
import { ProjectCollaboratorsRepository } from './repositories/project-collaborators.repository';
import { ProjectCollaboratorsService } from './services/project-collaborators.service';

@Module({
  imports: [EnumModule],
  controllers: [ProjectCollaboratorsController],
  providers: [ProjectCollaboratorsService, ProjectCollaboratorsRepository],
  exports: [ProjectCollaboratorsRepository],
})
export class ProjectCollaboratorsModule {}
