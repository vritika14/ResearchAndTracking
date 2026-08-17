import { NotFoundException } from '@nestjs/common';
import { ProjectModulesService } from './project-modules.service';
import { ProjectModulesRepository } from '../repositories/project-modules.repository';
import { EnumRepository } from '../../enum/repositories/enum.repository';
import { ModuleCollaboratorsRepository } from '../../module-collaborators/repositories/module-collaborators.repository';

describe('ProjectModulesService', () => {
  let service: ProjectModulesService;
  let repository: {
    findById: jest.Mock;
    findActiveByProject: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    archive: jest.Mock;
  };
  let enumRepository: {
    findByCategoryAndValue: jest.Mock;
    findValuesByIds: jest.Mock;
  };
  let collaboratorsRepository: { findByModuleAndUser: jest.Mock };

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findActiveByProject: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
    };
    enumRepository = {
      findByCategoryAndValue: jest.fn(),
      findValuesByIds: jest.fn().mockResolvedValue(new Map()),
    };
    collaboratorsRepository = {
      findByModuleAndUser: jest.fn().mockResolvedValue(undefined),
    };

    service = new ProjectModulesService(
      repository as unknown as ProjectModulesRepository,
      enumRepository as unknown as EnumRepository,
      collaboratorsRepository as unknown as ModuleCollaboratorsRepository,
    );
  });

  describe('findOne', () => {
    it('throws NotFoundException when the module does not exist', async () => {
      repository.findById.mockResolvedValue(undefined);
      await expect(
        service.findOne('tenant-1', 'module-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
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

      await service.create('project-1', 'tenant-1', 'user-1', {
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

    it('throws NotFoundException for an unknown tag value', async () => {
      enumRepository.findByCategoryAndValue.mockResolvedValue(undefined);
      await expect(
        service.create('project-1', 'tenant-1', 'user-1', {
          title: 'New Module',
          tag: 'NotReal',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('archive', () => {
    it('resolves the Archived status and sets archivedAt, returning a warning', async () => {
      repository.findById.mockResolvedValue({
        id: 'module-1',
        tagId: null,
        statusId: null,
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
