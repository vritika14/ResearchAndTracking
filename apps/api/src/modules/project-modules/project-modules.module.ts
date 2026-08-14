import { Module } from '@nestjs/common';
import { EnumModule } from '../enum/enum.module';
import { ProjectModulesController } from './controllers/project-modules.controller';
import { ProjectModulesRepository } from './repositories/project-modules.repository';
import { ProjectModulesService } from './services/project-modules.service';

@Module({
  imports: [EnumModule],
  controllers: [ProjectModulesController],
  providers: [ProjectModulesService, ProjectModulesRepository],
})
export class ProjectModulesModule {}
