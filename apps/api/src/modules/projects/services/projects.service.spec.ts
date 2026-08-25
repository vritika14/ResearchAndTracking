import { NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsRepository } from '../repositories/projects.repository';
import { EnumRepository } from '../../enum/repositories/enum.repository';
import { ProjectCollaboratorsRepository } from '../../project-collaborators/repositories/project-collaborators.repository';
import { TenantSequencesRepository } from '../../tenant-sequences/repositories/tenant-sequences.repository';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let repository: {
    findById: jest.Mock;
    findByIdGlobal: jest.Mock;
    findByIds: jest.Mock;
    findActiveByTenant: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    archive: jest.Mock;
  };
  let enumRepository: {
    findByCategoryAndValue: jest.Mock;
    findPipelineStageForProjectByValue: jest.Mock;
    findValuesByIds: jest.Mock;
  };
  let collaboratorsRepository: {
    findByProjectAndUser: jest.Mock;
    findProjectIdsByUser: jest.Mock;
  };
  let sequences: { nextDisplayId: jest.Mock };

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByIdGlobal: jest.fn(),
      findByIds: jest.fn(),
      findActiveByTenant: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
    };
    enumRepository = {
      findByCategoryAndValue: jest.fn(),
      findPipelineStageForProjectByValue: jest.fn(),
      findValuesByIds: jest
        .fn()
        .mockImplementation((ids: string[]) =>
          Promise.resolve(new Map(ids.map((id) => [id, id]))),
        ),
    };
    collaboratorsRepository = {
      findByProjectAndUser: jest.fn().mockResolvedValue(undefined),
      findProjectIdsByUser: jest.fn().mockResolvedValue([]),
    };
    sequences = {
      nextDisplayId: jest.fn().mockResolvedValue('PRJ-0001'),
    };

    service = new ProjectsService(
      repository as unknown as ProjectsRepository,
      enumRepository as unknown as EnumRepository,
      collaboratorsRepository as unknown as ProjectCollaboratorsRepository,
      sequences as unknown as TenantSequencesRepository,
    );
  });

  describe('findOne', () => {
    it('throws NotFoundException when the project does not exist', async () => {
      repository.findById.mockResolvedValue(undefined);
      await expect(
        service.findOne('tenant-1', 'project-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns the project when the caller is a collaborator', async () => {
      repository.findById.mockResolvedValue({
        id: 'project-1',
        title: 'Test',
        userId: 'owner-1',
        statusId: null,
        pipelineStageId: null,
        importanceId: null,
      });
      collaboratorsRepository.findByProjectAndUser.mockResolvedValue({
        roleId: 'role-collaborator',
      });
      const result = await service.findOne('tenant-1', 'project-1', 'user-1');
      expect(result).toEqual(
        expect.objectContaining({ id: 'project-1', title: 'Test' }),
      );
    });

    it('returns the project when the caller is the owner, even without an explicit collaborator row', async () => {
      repository.findById.mockResolvedValue({
        id: 'project-1',
        title: 'Test',
        userId: 'user-1',
        statusId: null,
        pipelineStageId: null,
        importanceId: null,
      });
      const result = await service.findOne('tenant-1', 'project-1', 'user-1');
      expect(result).toEqual(
        expect.objectContaining({ id: 'project-1', title: 'Test' }),
      );
    });

    it('throws NotFoundException when the caller is neither the owner nor a collaborator', async () => {
      repository.findById.mockResolvedValue({
        id: 'project-1',
        title: 'Test',
        userId: 'owner-1',
        statusId: null,
        pipelineStageId: null,
        importanceId: null,
      });
      await expect(
        service.findOne('tenant-1', 'project-1', 'outsider-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listForCaller', () => {
    it('returns every project the caller owns or collaborates on, across tenants', async () => {
      collaboratorsRepository.findProjectIdsByUser.mockResolvedValue([
        'project-1',
        'project-2',
      ]);
      repository.findByIds.mockResolvedValue([
        {
          id: 'project-1',
          tenantId: 'tenant-1',
          title: 'Owned here',
          userId: 'user-1',
          statusId: null,
          pipelineStageId: null,
          importanceId: null,
          archivedAt: null,
        },
        {
          id: 'project-2',
          tenantId: 'tenant-2',
          title: 'Collaborating elsewhere',
          userId: 'owner-2',
          statusId: null,
          pipelineStageId: null,
          importanceId: null,
          archivedAt: null,
        },
      ]);

      const result = await service.listForCaller('user-1');

      expect(repository.findByIds).toHaveBeenCalledWith([
        'project-1',
        'project-2',
      ]);
      expect(result.map((project) => project.id)).toEqual([
        'project-1',
        'project-2',
      ]);
    });

    it('excludes archived projects', async () => {
      collaboratorsRepository.findProjectIdsByUser.mockResolvedValue([
        'project-1',
      ]);
      repository.findByIds.mockResolvedValue([
        {
          id: 'project-1',
          tenantId: 'tenant-1',
          title: 'Archived',
          userId: 'user-1',
          statusId: null,
          pipelineStageId: null,
          importanceId: null,
          archivedAt: new Date(),
        },
      ]);

      const result = await service.listForCaller('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('findOneForCaller', () => {
    it('resolves the project real tenant and delegates to the access-checked findOne', async () => {
      repository.findByIdGlobal.mockResolvedValue({
        id: 'project-1',
        tenantId: 'tenant-1',
        userId: 'owner-1',
      });
      repository.findById.mockResolvedValue({
        id: 'project-1',
        title: 'Test',
        userId: 'owner-1',
        statusId: null,
        pipelineStageId: null,
        importanceId: null,
      });
      collaboratorsRepository.findByProjectAndUser.mockResolvedValue({
        roleId: 'role-collaborator',
      });

      const result = await service.findOneForCaller('project-1', 'user-1');

      expect(repository.findById).toHaveBeenCalledWith('tenant-1', 'project-1');
      expect(result).toEqual(expect.objectContaining({ id: 'project-1' }));
    });

    it('throws NotFoundException when the project does not exist in any tenant', async () => {
      repository.findByIdGlobal.mockResolvedValue(undefined);
      await expect(
        service.findOneForCaller('project-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('archiveForCaller', () => {
    it('resolves the project real tenant and delegates to the access-checked archive', async () => {
      repository.findByIdGlobal.mockResolvedValue({
        id: 'project-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
      });
      repository.findById.mockResolvedValue({
        id: 'project-1',
        userId: 'user-1',
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

      await service.archiveForCaller('project-1', 'user-1');

      expect(repository.archive).toHaveBeenCalledWith(
        'tenant-1',
        'project-1',
        'archived-status-id',
      );
    });

    it('throws NotFoundException when the project does not exist in any tenant', async () => {
      repository.findByIdGlobal.mockResolvedValue(undefined);
      await expect(
        service.archiveForCaller('project-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listActive', () => {
    it('filters out projects the caller cannot see', async () => {
      repository.findActiveByTenant.mockResolvedValue([
        {
          id: 'project-1',
          title: 'Visible via ownership',
          userId: 'user-1',
          statusId: null,
          pipelineStageId: null,
          importanceId: null,
        },
        {
          id: 'project-2',
          title: 'Visible via collaboration',
          userId: 'owner-2',
          statusId: null,
          pipelineStageId: null,
          importanceId: null,
        },
        {
          id: 'project-3',
          title: 'Not visible',
          userId: 'owner-3',
          statusId: null,
          pipelineStageId: null,
          importanceId: null,
        },
      ]);
      collaboratorsRepository.findByProjectAndUser.mockImplementation(
        (_tenantId: string, projectId: string) =>
          Promise.resolve(
            projectId === 'project-2'
              ? { roleId: 'role-collaborator' }
              : undefined,
          ),
      );

      const result = await service.listActive('tenant-1', 'user-1');

      expect(result.map((project) => project.id)).toEqual([
        'project-1',
        'project-2',
      ]);
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
        pipelineStageId: 'project_pipeline_stage-Concept & Ideation-id',
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
          pipelineStageId: 'project_pipeline_stage-Concept & Ideation-id',
          importanceId: 'importance-High-id',
        }),
        expect.any(String),
      );
    });

    it('passes an ordered project-specific stage list to the creation transaction', async () => {
      enumRepository.findByCategoryAndValue.mockImplementation(
        (category: string, value: string) =>
          Promise.resolve({ id: `${category}-${value}-id` }),
      );
      repository.create.mockResolvedValue({
        id: 'project-1',
        statusId: null,
        pipelineStageId: 'scoped-stage-2',
        importanceId: null,
      });

      await service.create('user-1', 'tenant-1', {
        title: 'Custom workflow project',
        pipelineStage: 'Analysis',
        pipelineStages: ['Concept', 'Analysis', 'Publication'],
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ pipelineStageId: undefined }),
        expect.any(String),
        ['Concept', 'Analysis', 'Publication'],
        'Analysis',
      );
      expect(enumRepository.findByCategoryAndValue).not.toHaveBeenCalledWith(
        'project_pipeline_stage',
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
        userId: 'user-1',
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
        userId: 'user-1',
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
