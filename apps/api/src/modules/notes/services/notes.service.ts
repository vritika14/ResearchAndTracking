import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TenantSequencesRepository } from '../../tenant-sequences/repositories/tenant-sequences.repository';
import { NotesRepository } from '../repositories/notes.repository';

@Injectable()
export class NotesService {
  constructor(
    private readonly repository: NotesRepository,
    private readonly sequences: TenantSequencesRepository,
  ) {}

  async list(tenantId: string, projectId?: string) {
    return this.repository.findByTenant(tenantId, projectId);
  }

  async findOne(tenantId: string, noteId: string) {
    const note = await this.repository.findById(tenantId, noteId);
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }

  async create(
    tenantId: string,
    createdBy: string,
    input: {
      title: string;
      content?: string;
      projectId?: string;
      moduleId?: string;
    },
  ) {
    if (input.moduleId && !input.projectId) {
      throw new BadRequestException(
        'moduleId requires projectId to also be provided',
      );
    }

    const displayId = await this.sequences.nextDisplayId(tenantId, 'note');

    return this.repository.create({
      tenantId,
      projectId: input.projectId,
      moduleId: input.moduleId,
      createdBy,
      title: input.title,
      content: input.content,
      displayId,
    });
  }

  async update(
    tenantId: string,
    noteId: string,
    input: Partial<{ title: string; content: string }>,
  ) {
    await this.findOne(tenantId, noteId);
    const note = await this.repository.update(tenantId, noteId, input);
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }

  async delete(tenantId: string, noteId: string) {
    const note = await this.repository.delete(tenantId, noteId);
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }
}
