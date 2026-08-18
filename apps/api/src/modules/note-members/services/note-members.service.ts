// apps/api/src/modules/note-members/services/note-members.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NoteMembersRepository } from '../repositories/note-members.repository';

@Injectable()
export class NoteMembersService {
  constructor(private readonly repository: NoteMembersRepository) {}

  async list(tenantId: string, noteId: string) {
    return this.repository.findByNote(tenantId, noteId);
  }

  async add(tenantId: string, noteId: string, userId: string) {
    const existing = await this.repository.findByNoteAndUser(
      tenantId,
      noteId,
      userId,
    );
    if (existing) {
      throw new ConflictException('This user is already a member of this note');
    }
    return this.repository.create({ tenantId, noteId, userId });
  }

  async remove(tenantId: string, noteId: string, userId: string) {
    const row = await this.repository.delete(tenantId, noteId, userId);
    if (!row) {
      throw new NotFoundException('Member not found on this note');
    }
    return row;
  }
}
