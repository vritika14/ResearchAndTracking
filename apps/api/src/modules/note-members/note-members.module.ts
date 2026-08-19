// apps/api/src/modules/note-members/note-members.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { NoteMembersController } from './controllers/note-members.controller';
import { NoteMembersRepository } from './repositories/note-members.repository';
import { NoteMembersService } from './services/note-members.service';
import { MembershipsModule } from '../memberships/memberships.module';
import { NotesModule } from '../notes/notes.module';
import { UsersModule } from '../users/users.module';

@Module({
  controllers: [NoteMembersController],
  providers: [NoteMembersService, NoteMembersRepository],
  exports: [NoteMembersRepository],
  imports: [MembershipsModule, forwardRef(() => NotesModule), UsersModule],
})
export class NoteMembersModule {}
