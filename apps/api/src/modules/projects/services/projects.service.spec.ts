import { NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsRepository } from '../repositories/projects.repository';
import { EnumRepository } from '../../enum/repositories/enum.repository';
import { ProjectCollaboratorsRepository } from '../../project-collaborators/repositories/project-collaborators.repository';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let repository: {
    findById: jest.Mock;
    findActiveByTenant: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    archive: jest.Mock;
  };
  let enumRepository: {
    findByCategoryAndValue: jest.Mock;
    findValuesByIds: jest.Mock;
  };
  let collaboratorsRepository: { findByProjectAndUser: jest.Mock };

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findActiveByTenant: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
    };
    enumRepository = {
      findByCategoryAndValue: jest.fn(),
      findValuesByIds: jest.fn().mockResolvedValue(new Map()),
    };
    collaboratorsRepository = {
      findByProjectAndUser: jest.fn().mockResolvedValue(undefined),
    };

    service = new ProjectsService(
      repository as unknown as ProjectsRepository,
      enumRepository as unknown as EnumRepository,
      collaboratorsRepository as unknown as ProjectCollaboratorsRepository,
    );
  });

  describe('findOne', () => {
    it('throws NotFoundException when the project does not exist', async () => {
      repository.findById.mockResolvedValue(undefined);
      await expect(
        service.findOne('tenant-1', 'project-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns the project when found', async () => {
      repository.findById.mockResolvedValue({
        id: 'project-1',
        title: 'Test',
        statusId: null,
        pipelineStageId: null,
        importanceId: null,
      });
      const result = await service.findOne('tenant-1', 'project-1', 'user-1');
      expect(result).toEqual(
        expect.objectContaining({ id: 'project-1', title: 'Test' }),
      );
    });
  });

  describe('create', () => {
    it('resolves status/pipelineStage/importance to enum ids', async () => {
      enumRepository.findByCategoryAndValue.mockImplementation(
        (category: string, value: string) =>
          Promise.resolve({ id: `${category}-${value}-id` }),
      );
      repository.create.mockResolvedValue({
        id: 'project-1',
        statusId: 'project_status-Active-id',
        pipelineStageId: 'pipeline_stage-Concept & Ideation-id',
        importanceId: 'importance-High-id',
      });

      await service.create('user-1', 'tenant-1', {
        title: 'New Project',
        status: 'Active',
        pipelineStage: 'Concept & Ideation',
        importance: 'High',
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          statusId: 'project_status-Active-id',
          pipelineStageId: 'pipeline_stage-Concept & Ideation-id',
          importanceId: 'importance-High-id',
        }),
        expect.any(String),
      );
    });

    it('throws NotFoundException for an unknown enum value', async () => {
      enumRepository.findByCategoryAndValue.mockResolvedValue(undefined);

      await expect(
        service.create('user-1', 'tenant-1', {
          title: 'New Project',
          status: 'NotReal',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('leaves enum fields undefined when not provided', async () => {
      enumRepository.findByCategoryAndValue.mockImplementation(
        (category: string, _value: string) =>
          category === 'project_role'
            ? Promise.resolve({ id: 'owner-role-id' })
            : Promise.resolve(undefined),
      );
      repository.create.mockResolvedValue({
        id: 'project-1',
        statusId: null,
        pipelineStageId: null,
        importanceId: null,
      });

      await service.create('user-1', 'tenant-1', { title: 'New Project' });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          statusId: undefined,
          pipelineStageId: undefined,
          importanceId: undefined,
        }),
        'owner-role-id',
      );
    });
  });

  describe('update', () => {
    it('only resolves enum fields that were actually provided', async () => {
      repository.findById.mockResolvedValue({
        id: 'project-1',
        statusId: null,
        pipelineStageId: null,
        importanceId: null,
      });
      repository.update.mockResolvedValue({
        id: 'project-1',
        title: 'Updated',
        statusId: null,
        pipelineStageId: null,
        importanceId: null,
      });

      await service.update('tenant-1', 'project-1', 'user-1', {
        title: 'Updated',
      });

      expect(enumRepository.findByCategoryAndValue).not.toHaveBeenCalled();
    });

    it('throws NotFoundException if the project does not exist', async () => {
      repository.findById.mockResolvedValue(undefined);
      await expect(
        service.update('tenant-1', 'project-1', 'user-1', { title: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('archive', () => {
    it('resolves the Archived status and sets archivedAt, returning a warning', async () => {
      repository.findById.mockResolvedValue({
        id: 'project-1',
        statusId: null,
        pipelineStageId: null,
        importanceId: null,
      });
      enumRepository.findByCategoryAndValue.mockResolvedValue({
        id: 'archived-status-id',
      });
      repository.archive.mockResolvedValue({
        id: 'project-1',
        statusId: 'archived-status-id',
        pipelineStageId: null,
        importanceId: null,
      });

      const result = await service.archive('tenant-1', 'project-1', 'user-1');

      expect(repository.archive).toHaveBeenCalledWith(
        'tenant-1',
        'project-1',
        'archived-status-id',
      );
      expect(result.warning).toContain('14 days');
    });

    it('throws NotFoundException if the project does not exist', async () => {
      repository.findById.mockResolvedValue(undefined);
      await expect(
        service.archive('tenant-1', 'project-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
