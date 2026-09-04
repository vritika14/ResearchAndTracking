import { Module } from '@nestjs/common';
import { EnumModule } from '../enum/enum.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { ModuleCollaboratorsModule } from '../module-collaborators/module-collaborators.module';
import { ProjectModulesModule } from '../project-modules/project-modules.module';
import { UsersModule } from '../users/users.module';
import { ModulePipelineStagesController } from './controllers/module-pipeline-stages.controller';
import { ModulePipelineStagesService } from './services/module-pipeline-stages.service';

@Module({
  imports: [
    EnumModule,
    MembershipsModule,
    UsersModule,
    ModuleCollaboratorsModule,
    ProjectModulesModule,
  ],
  controllers: [ModulePipelineStagesController],
  providers: [ModulePipelineStagesService],
})
export class ModulePipelineStagesModule {}
