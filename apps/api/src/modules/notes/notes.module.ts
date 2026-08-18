import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { NotesController } from './controllers/notes.controller';
import { NotesRepository } from './repositories/notes.repository';
import { NotesService } from './services/notes.service';
import { TenantSequencesModule } from '../tenant-sequences/tenant-sequences.module';
import { NoteMembersModule } from '../note-members/note-members.module';
import { EnumModule } from '../enum/enum.module';
@Module({
  imports: [UsersModule, TenantSequencesModule, NoteMembersModule, EnumModule],
  controllers: [NotesController],
  providers: [NotesService, NotesRepository],
})
export class NotesModule {}
