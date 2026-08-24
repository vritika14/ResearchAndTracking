import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnumRepository } from '../../enum/repositories/enum.repository';
import { NoteMembersRepository } from '../../note-members/repositories/note-members.repository';
import { ProjectModulesRepository } from '../../project-modules/repositories/project-modules.repository';
import { TenantSequencesRepository } from '../../tenant-sequences/repositories/tenant-sequences.repository';
import { NotesRepository } from '../repositories/notes.repository';

@Injectable()
export class NotesService {
  constructor(
    private readonly repository: NotesRepository,
    private readonly enumRepository: EnumRepository,
    private readonly sequences: TenantSequencesRepository,
    private readonly noteMembers: NoteMembersRepository,
    private readonly modulesRepository: ProjectModulesRepository,
  ) {}

  /**
   * A note links to at most one of a project or a module, never both
   * independently supplied. When moduleId is given, the project is derived
   * from the module itself (which may be null, for an independent module)
   * rather than trusted from the caller — this is what makes it possible to
   * link a note to an independent module in the first place.
   */
  private async resolveLinkage(
    tenantId: string,
    input: { projectId?: string; moduleId?: string },
  ): Promise<{ projectId: string | null; moduleId: string | null }> {
    if (input.moduleId) {
      const module = await this.modulesRepository.findById(
        tenantId,
        input.moduleId,
      );
      if (!module) {
        throw new BadRequestException('Unknown moduleId');
      }
      return { projectId: module.projectId, moduleId: module.id };
    }
    return { projectId: input.projectId ?? null, moduleId: null };
  }

  /**
   * A note is visible only to its creator or a note_members row for the
   * caller. A Private note's members are always empty (creation/update
   * clears them), and a Shared note always has its creator auto-inserted as
   * a member, so this single check correctly covers both visibility states.
   */
  private async canAccess(
    tenantId: string,
    note: { id: string; createdBy: string },
    callerUserId: string,
  ): Promise<boolean> {
    if (note.createdBy === callerUserId) return true;
    const membership = await this.noteMembers.findByNoteAndUser(
      tenantId,
      note.id,
      callerUserId,
    );
    return Boolean(membership);
  }

  async list(tenantId: string, callerUserId: string, projectId?: string) {
    const rows = await this.repository.findByTenant(tenantId, projectId);
    const accessFlags = await Promise.all(
      rows.map((row) => this.canAccess(tenantId, row, callerUserId)),
    );
    return rows.filter((_row, index) => accessFlags[index]);
  }

  async findOne(tenantId: string, noteId: string, callerUserId: string) {
    const note = await this.repository.findById(tenantId, noteId);
    if (!note || !(await this.canAccess(tenantId, note, callerUserId))) {
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
    const visibilityValue = input.visibility ?? 'Private';

    const [{ projectId, moduleId }, visibilityId, displayId] = await Promise.all([
      this.resolveLinkage(tenantId, input),
      this.resolveEnum('visibility', visibilityValue),
      this.sequences.nextDisplayId(tenantId, 'note'),
    ]);

    const note = await this.repository.create({
      tenantId,
      projectId: projectId ?? undefined,
      moduleId: moduleId ?? undefined,
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
      await this.noteMembers.create({
        tenantId,
        noteId: note.id,
        userId: createdBy,
      });
    }

    return note;
  }

  async update(
    tenantId: string,
    noteId: string,
    callerUserId: string,
    input: Partial<{
      title: string;
      content: string;
      visibility: string;
      projectId: string;
      moduleId: string;
    }>,
  ) {
    const existing = await this.findOne(tenantId, noteId, callerUserId);
    if (!existing) {
      throw new NotFoundException('Note not found');
    }
  
    const changesLinkage =
      input.projectId !== undefined || input.moduleId !== undefined;
    const [linkage, visibilityId] = await Promise.all([
      changesLinkage ? this.resolveLinkage(tenantId, input) : undefined,
      input.visibility
        ? this.resolveEnum('visibility', input.visibility)
        : undefined,
    ]);
  
    const note = await this.repository.update(tenantId, noteId, {
      title: input.title,
      content: input.content,
      visibilityId,
      projectId: linkage ? linkage.projectId : undefined,
      moduleId: linkage ? linkage.moduleId : undefined,
    });
  
    if (!note) {
      throw new NotFoundException('Note not found');
    }
  
    if (input.visibility === 'Private') {
      await this.noteMembers.deleteAllForNote(tenantId, noteId);
    }
  
    const { visibilityId: _vId, ...rest } = note;
    const visibilityValue = note.visibilityId
      ? (await this.enumRepository.findValuesByIds([note.visibilityId])).get(note.visibilityId) ?? null
      : null;
  
    return { ...rest, visibility: visibilityValue };
  }

  async delete(tenantId: string, noteId: string, callerUserId: string) {
    const existing = await this.repository.findById(tenantId, noteId);
    if (
      !existing ||
      !(await this.canAccess(tenantId, existing, callerUserId))
    ) {
      throw new NotFoundException('Note not found');
    }
    const note = await this.repository.delete(tenantId, noteId);
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }

  private async resolveEnum(
    category: string,
    value?: string,
  ): Promise<string | undefined> {
    if (!value) return undefined;
    const match = await this.enumRepository.findByCategoryAndValue(
      category,
      value,
    );
    if (!match) {
      throw new NotFoundException(`Unknown ${category} value: "${value}"`);
    }
    return match.id;
  }
}
