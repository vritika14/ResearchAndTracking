import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EnumRepository } from '../../enum/repositories/enum.repository';
import { NoteMembersRepository } from '../../note-members/repositories/note-members.repository';
import { TenantSequencesRepository } from '../../tenant-sequences/repositories/tenant-sequences.repository';
import { NotesRepository } from '../repositories/notes.repository';

@Injectable()
export class NotesService {
  constructor(
    private readonly repository: NotesRepository,
    private readonly enumRepository: EnumRepository,
    private readonly sequences: TenantSequencesRepository,
    private readonly noteMembers: NoteMembersRepository,
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
      visibility?: string;
    },
  ) {
    if (input.moduleId && !input.projectId) {
      throw new BadRequestException('moduleId requires projectId to also be provided');
    }

    const visibilityValue = input.visibility ?? 'Private';

    const [visibilityId, displayId] = await Promise.all([
      this.resolveEnum('visibility', visibilityValue),
      this.sequences.nextDisplayId(tenantId, 'note'),
    ]);

    const note = await this.repository.create({
      tenantId,
      projectId: input.projectId,
      moduleId: input.moduleId,
      createdBy,
      title: input.title,
      content: input.content,
      visibilityId,
      displayId,
    });

    if (!note) {
      throw new NotFoundException('Failed to create note');
    }

    if (visibilityValue === 'Shared') {
      await this.noteMembers.create({ tenantId, noteId: note.id, userId: createdBy });
    }

    return note;
  }

  async update(
    tenantId: string,
    noteId: string,
    input: Partial<{ title: string; content: string; visibility: string }>,
  ) {
    const existing = await this.findOne(tenantId, noteId);
    if (!existing) {
      throw new NotFoundException('Note not found');
    }

    const visibilityId = input.visibility
      ? await this.resolveEnum('visibility', input.visibility)
      : undefined;

    const note = await this.repository.update(tenantId, noteId, {
      title: input.title,
      content: input.content,
      visibilityId,
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (input.visibility === 'Private') {
      await this.noteMembers.deleteAllForNote(tenantId, noteId);
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

  private async resolveEnum(category: string, value?: string): Promise<string | undefined> {
    if (!value) return undefined;
    const match = await this.enumRepository.findByCategoryAndValue(category, value);
    if (!match) {
      throw new NotFoundException(`Unknown ${category} value: "${value}"`);
    }
    return match.id;
  }
}
