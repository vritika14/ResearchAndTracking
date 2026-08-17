import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { NotesController } from './controllers/notes.controller';
import { NotesRepository } from './repositories/notes.repository';
import { NotesService } from './services/notes.service';
import { TenantSequencesModule } from '../tenant-sequences/tenant-sequences.module';
@Module({
  imports: [UsersModule, TenantSequencesModule],
  controllers: [NotesController],
  providers: [NotesService, NotesRepository],
})
export class NotesModule {}
