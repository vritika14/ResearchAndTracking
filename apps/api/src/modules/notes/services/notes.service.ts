import { Injectable, NotFoundException } from '@nestjs/common';
import { NotesRepository } from '../repositories/notes.repository';

@Injectable()
export class NotesService {
  constructor(private readonly repository: NotesRepository) {}

  async listByProject(tenantId: string, projectId: string) {
    return this.repository.findByProject(tenantId, projectId);
  }

  async findOne(tenantId: string, noteId: string) {
    const note = await this.repository.findById(tenantId, noteId);
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }

  async create(
    projectId: string,
    tenantId: string,
    createdBy: string,
    input: { title: string; content?: string; moduleId?: string },
  ) {
    return this.repository.create({
      projectId,
      tenantId,
      createdBy,
      title: input.title,
      content: input.content,
      moduleId: input.moduleId,
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
