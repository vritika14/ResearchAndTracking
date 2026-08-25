import { NotFoundException } from '@nestjs/common';
import { ProjectModulesService } from './project-modules.service';
import { ProjectModulesRepository } from '../repositories/project-modules.repository';
import { EnumRepository } from '../../enum/repositories/enum.repository';
import { ModuleCollaboratorsRepository } from '../../module-collaborators/repositories/module-collaborators.repository';
import { ProjectCollaboratorsRepository } from '../../project-collaborators/repositories/project-collaborators.repository';
import { TenantSequencesRepository } from '../../tenant-sequences/repositories/tenant-sequences.repository';

describe('ProjectModulesService', () => {
  let service: ProjectModulesService;
  let repository: {
    findById: jest.Mock;
    findByIdGlobal: jest.Mock;
    findByIds: jest.Mock;
    findByProjectIds: jest.Mock;
    findActiveByTenant: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    archive: jest.Mock;
  };
  let enumRepository: {
    findByCategoryAndValue: jest.Mock;
    findPipelineStageForModuleByValue: jest.Mock;
    findValuesByIds: jest.Mock;
  };
  let collaboratorsRepository: {
    findByModuleAndUser: jest.Mock;
    findModuleIdsByUser: jest.Mock;
    create: jest.Mock;
  };
  let projectCollaboratorsRepository: {
    findByProjectAndUser: jest.Mock;
    findProjectIdsByUser: jest.Mock;
  };
  let sequences: { nextDisplayId: jest.Mock };

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByIdGlobal: jest.fn(),
      findByIds: jest.fn(),
      findByProjectIds: jest.fn(),
      findActiveByTenant: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
    };
    enumRepository = {
      findByCategoryAndValue: jest.fn(),
      findPipelineStageForModuleByValue: jest.fn(),
      findValuesByIds: jest.fn().mockResolvedValue(new Map()),
    };
    collaboratorsRepository = {
      findByModuleAndUser: jest.fn().mockResolvedValue(undefined),
      findModuleIdsByUser: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'collaborator-1' }),
    };
    projectCollaboratorsRepository = {
      findByProjectAndUser: jest.fn().mockResolvedValue(undefined),
      findProjectIdsByUser: jest.fn().mockResolvedValue([]),
    };
    sequences = {
      nextDisplayId: jest.fn().mockResolvedValue('MOD-0001'),
    };

    service = new ProjectModulesService(
      repository as unknown as ProjectModulesRepository,
      enumRepository as unknown as EnumRepository,
      collaboratorsRepository as unknown as ModuleCollaboratorsRepository,
      projectCollaboratorsRepository as unknown as ProjectCollaboratorsRepository,
      sequences as unknown as TenantSequencesRepository,
    );
  });

  describe('findOne', () => {
    it('throws NotFoundException when the module does not exist', async () => {
      repository.findById.mockResolvedValue(undefined);
      await expect(
        service.findOne('tenant-1', 'module-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the caller cannot access an independent module', async () => {
      repository.findById.mockResolvedValue({
        id: 'module-1',
        projectId: null,
        tagId: null,
        statusId: null,
      });
      await expect(
        service.findOne('tenant-1', 'module-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns an independent module when the caller is a module collaborator', async () => {
      repository.findById.mockResolvedValue({
        id: 'module-1',
        projectId: null,
        tagId: null,
        statusId: null,
      });
      collaboratorsRepository.findByModuleAndUser.mockResolvedValue({
        roleId: 'role-1',
      });
      const result = await service.findOne('tenant-1', 'module-1', 'user-1');
      expect(result).toEqual(expect.objectContaining({ id: 'module-1' }));
    });

    it('returns a project-scoped module when the caller can see the parent project', async () => {
      repository.findById.mockResolvedValue({
        id: 'module-1',
        projectId: 'project-1',
        tagId: null,
        statusId: null,
      });
      projectCollaboratorsRepository.findByProjectAndUser.mockResolvedValue({
        roleId: 'role-1',
      });
      const result = await service.findOne('tenant-1', 'module-1', 'user-1');
      expect(result).toEqual(expect.objectContaining({ id: 'module-1' }));
      expect(
        collaboratorsRepository.findByModuleAndUser,
      ).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for a project-scoped module when the caller cannot see the parent project', async () => {
      repository.findById.mockResolvedValue({
        id: 'module-1',
        projectId: 'project-1',
        tagId: null,
        statusId: null,
      });
      await expect(
        service.findOne('tenant-1', 'module-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listForCaller', () => {
    it('combines project-linked modules with independent modules the caller collaborates on', async () => {
      projectCollaboratorsRepository.findProjectIdsByUser.mockResolvedValue([
        'project-1',
      ]);
      collaboratorsRepository.findModuleIdsByUser.mockResolvedValue([
        'module-2',
      ]);
      repository.findByProjectIds.mockResolvedValue([
        {
          id: 'module-1',
          projectId: 'project-1',
          tagId: null,
          statusId: null,
          archivedAt: null,
        },
      ]);
      repository.findByIds.mockResolvedValue([
        {
          id: 'module-2',
          projectId: null,
          tagId: null,
          statusId: null,
          archivedAt: null,
        },
      ]);

      const result = await service.listForCaller('user-1');

      expect(repository.findByProjectIds).toHaveBeenCalledWith(['project-1']);
      expect(repository.findByIds).toHaveBeenCalledWith(['module-2']);
      expect(result.map((module) => module.id)).toEqual([
        'module-1',
        'module-2',
      ]);
    });

    it('excludes archived modules and de-duplicates modules reachable both ways', async () => {
      projectCollaboratorsRepository.findProjectIdsByUser.mockResolvedValue([
        'project-1',
      ]);
      collaboratorsRepository.findModuleIdsByUser.mockResolvedValue([
        'module-1',
      ]);
      repository.findByProjectIds.mockResolvedValue([
        {
          id: 'module-1',
          projectId: 'project-1',
          tagId: null,
          statusId: null,
          archivedAt: null,
        },
        {
          id: 'module-2',
          projectId: 'project-1',
          tagId: null,
          statusId: null,
          archivedAt: new Date(),
        },
      ]);
      repository.findByIds.mockResolvedValue([
        {
          id: 'module-1',
          projectId: 'project-1',
          tagId: null,
          statusId: null,
          archivedAt: null,
        },
      ]);

      const result = await service.listForCaller('user-1');

      expect(result.map((module) => module.id)).toEqual(['module-1']);
    });
  });

  describe('findOneForCaller', () => {
    it('resolves the module real tenant and delegates to the access-checked findOne', async () => {
      repository.findByIdGlobal.mockResolvedValue({
        id: 'module-1',
        tenantId: 'tenant-1',
        projectId: null,
      });
      repository.findById.mockResolvedValue({
        id: 'module-1',
        projectId: null,
        tagId: null,
        statusId: null,
      });
      collaboratorsRepository.findByModuleAndUser.mockResolvedValue({
        roleId: 'role-1',
      });

      const result = await service.findOneForCaller('module-1', 'user-1');

      expect(repository.findById).toHaveBeenCalledWith('tenant-1', 'module-1');
      expect(result).toEqual(expect.objectContaining({ id: 'module-1' }));
    });

    it('throws NotFoundException when the module does not exist in any tenant', async () => {
      repository.findByIdGlobal.mockResolvedValue(undefined);
      await expect(
        service.findOneForCaller('module-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('archiveForCaller', () => {
    it('resolves the module real tenant and delegates to the access-checked archive', async () => {
      repository.findByIdGlobal.mockResolvedValue({
        id: 'module-1',
        tenantId: 'tenant-1',
        projectId: null,
      });
      repository.findById.mockResolvedValue({
        id: 'module-1',
        projectId: null,
        tagId: null,
        statusId: null,
      });
      collaboratorsRepository.findByModuleAndUser.mockResolvedValue({
        roleId: 'role-1',
      });
      enumRepository.findByCategoryAndValue.mockResolvedValue({
        id: 'archived-status-id',
      });
      repository.archive.mockResolvedValue({
        id: 'module-1',
        tagId: null,
        statusId: 'archived-status-id',
      });

      await service.archiveForCaller('module-1', 'user-1');

      expect(repository.archive).toHaveBeenCalledWith(
        'tenant-1',
        'module-1',
        'archived-status-id',
      );
    });

    it('throws NotFoundException when the module does not exist in any tenant', async () => {
      repository.findByIdGlobal.mockResolvedValue(undefined);
      await expect(
        service.archiveForCaller('module-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listActive', () => {
    it('filters out modules the caller cannot see', async () => {
      repository.findActiveByTenant.mockResolvedValue([
        { id: 'module-1', projectId: null, tagId: null, statusId: null },
        { id: 'module-2', projectId: 'project-1', tagId: null, statusId: null },
        { id: 'module-3', projectId: 'project-2', tagId: null, statusId: null },
      ]);
      collaboratorsRepository.findByModuleAndUser.mockImplementation(
        (_tenantId: string, moduleId: string) =>
          Promise.resolve(
            moduleId === 'module-1' ? { roleId: 'role-1' } : undefined,
          ),
      );
      projectCollaboratorsRepository.findByProjectAndUser.mockImplementation(
        (_tenantId: string, projectId: string) =>
          Promise.resolve(
            projectId === 'project-1' ? { roleId: 'role-1' } : undefined,
          ),
      );

      const result = await service.listActive('tenant-1', 'user-1');

      expect(result.map((module) => module.id)).toEqual([
        'module-1',
        'module-2',
      ]);
    });
  });

  describe('create', () => {
    it('resolves tag and status to enum ids', async () => {
      enumRepository.findByCategoryAndValue.mockImplementation(
        (category: string, value: string) =>
          Promise.resolve({ id: `${category}-${value}-id` }),
      );
      repository.create.mockResolvedValue({
        id: 'module-1',
        tagId: 'module_type-Research Paper-id',
        statusId: 'project_status-Active-id',
      });

      await service.create('tenant-1', 'user-1', {
        title: 'New Module',
        tag: 'Research Paper',
        status: 'Active',
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tagId: 'module_type-Research Paper-id',
          statusId: 'project_status-Active-id',
        }),
      );
    });

    it('passes an ordered module-specific stage list to the creation transaction', async () => {
      enumRepository.findByCategoryAndValue.mockImplementation(
        (category: string, value: string) =>
          Promise.resolve({ id: `${category}-${value}-id` }),
      );
      repository.create.mockResolvedValue({
        id: 'module-1',
        tagId: null,
        statusId: null,
        pipelineStageId: 'scoped-stage-1',
      });

      await service.create('tenant-1', 'user-1', {
        title: 'Custom workflow module',
        pipelineStage: 'Drafting',
        pipelineStages: ['Drafting', 'Internal Review', 'Published'],
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ pipelineStageId: undefined }),
        ['Drafting', 'Internal Review', 'Published'],
        'Drafting',
      );
      expect(enumRepository.findByCategoryAndValue).not.toHaveBeenCalledWith(
        'module_pipeline_stage',
        expect.any(String),
      );
    });

    it('throws NotFoundException for an unknown tag value', async () => {
      enumRepository.findByCategoryAndValue.mockResolvedValue(undefined);
      await expect(
        service.create('tenant-1', 'user-1', {
          title: 'New Module',
          tag: 'NotReal',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('adds the creator as a module collaborator for an independent module', async () => {
      enumRepository.findByCategoryAndValue.mockImplementation(
        (category: string, value: string) =>
          Promise.resolve({ id: `${category}-${value}-id` }),
      );
      repository.create.mockResolvedValue({
        id: 'module-1',
        tagId: null,
        statusId: null,
      });

      await service.create('tenant-1', 'user-1', {
        title: 'Independent module',
      });

      expect(collaboratorsRepository.create).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        moduleId: 'module-1',
        userId: 'user-1',
        roleId: 'project_role-Owner-id',
      });
    });

    it('does not add a collaborator for a project-scoped module', async () => {
      enumRepository.findByCategoryAndValue.mockImplementation(
        (category: string, value: string) =>
          Promise.resolve({ id: `${category}-${value}-id` }),
      );
      repository.create.mockResolvedValue({
        id: 'module-1',
        tagId: null,
        statusId: null,
      });

      await service.create('tenant-1', 'user-1', {
        title: 'Project module',
        projectId: 'project-1',
      });

      expect(collaboratorsRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('archive', () => {
    it('resolves the Archived status and sets archivedAt, returning a warning', async () => {
      repository.findById.mockResolvedValue({
        id: 'module-1',
        projectId: null,
        tagId: null,
        statusId: null,
      });
      collaboratorsRepository.findByModuleAndUser.mockResolvedValue({
        roleId: 'role-1',
      });
      enumRepository.findByCategoryAndValue.mockResolvedValue({
        id: 'archived-status-id',
      });
      repository.archive.mockResolvedValue({
        id: 'module-1',
        tagId: null,
        statusId: 'archived-status-id',
      });

      const result = await service.archive('tenant-1', 'module-1', 'user-1');

      expect(repository.archive).toHaveBeenCalledWith(
        'tenant-1',
        'module-1',
        'archived-status-id',
      );
      expect(result.warning).toContain('14 days');
    });

    it('throws NotFoundException if the module does not exist', async () => {
      repository.findById.mockResolvedValue(undefined);
      await expect(
        service.archive('tenant-1', 'module-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
