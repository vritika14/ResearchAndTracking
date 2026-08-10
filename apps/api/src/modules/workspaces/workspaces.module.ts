import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { WorkspacesController } from './controllers/workspaces.controller';
import { WorkspacesRepository } from './repositories/workspaces.repository';
import { WorkspacesService } from './services/workspaces.service';

@Module({
  imports: [UsersModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspacesRepository],
  exports: [WorkspacesService, WorkspacesRepository],
})
export class WorkspacesModule {}
