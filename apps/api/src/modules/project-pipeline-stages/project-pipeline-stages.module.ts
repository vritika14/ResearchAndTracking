// apps/api/src/modules/project-pipeline-stages/project-pipeline-stages.module.ts
import { Module } from '@nestjs/common';
import { EnumModule } from '../enum/enum.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { ProjectsModule } from '../projects/project.module';
import { UsersModule } from '../users/users.module';
import { ProjectPipelineStagesController } from './controllers/project-pipeline-stages.controller';
import { ProjectPipelineStagesService } from './services/project-pipeline-stages.service';

@Module({
  imports: [EnumModule, MembershipsModule, UsersModule, ProjectsModule],
  controllers: [ProjectPipelineStagesController],
  providers: [ProjectPipelineStagesService],
})
export class ProjectPipelineStagesModule {}
