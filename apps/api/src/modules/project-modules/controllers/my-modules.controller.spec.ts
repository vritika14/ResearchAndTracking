import { MyModulesController } from './my-modules.controller';
import { ProjectModulesService } from '../services/project-modules.service';
import { UsersService } from '../../users/users.service';

describe('MyModulesController', () => {
  let controller: MyModulesController;
  let modulesService: {
    listForCaller: jest.Mock;
    findOneForCaller: jest.Mock;
    updateForCaller: jest.Mock;
    archiveForCaller: jest.Mock;
    listPipelineStagesForCaller: jest.Mock;
  };
  let usersService: { findByExternalAuthId: jest.Mock };

  beforeEach(() => {
    modulesService = {
      listForCaller: jest.fn(),
      findOneForCaller: jest.fn(),
      updateForCaller: jest.fn(),
      archiveForCaller: jest.fn(),
      listPipelineStagesForCaller: jest.fn(),
    };
    usersService = {
      findByExternalAuthId: jest.fn().mockResolvedValue({ id: 'user-1' }),
    };
    controller = new MyModulesController(
      modulesService as unknown as ProjectModulesService,
      usersService as unknown as UsersService,
    );
  });

  function req() {
    return { user: { sub: 'cognito-sub-1' } } as never;
  }

  it('list() resolves the caller and delegates to listForCaller', async () => {
    modulesService.listForCaller.mockResolvedValue([{ id: 'module-1' }]);
    const result = await controller.list(req());
    expect(usersService.findByExternalAuthId).toHaveBeenCalledWith(
      'cognito-sub-1',
    );
    expect(modulesService.listForCaller).toHaveBeenCalledWith('user-1');
    expect(result).toEqual([{ id: 'module-1' }]);
  });

  it('findOne() delegates to findOneForCaller with the module id and caller id', async () => {
    modulesService.findOneForCaller.mockResolvedValue({ id: 'module-1' });
    const result = await controller.findOne('module-1', req());
    expect(modulesService.findOneForCaller).toHaveBeenCalledWith(
      'module-1',
      'user-1',
    );
    expect(result).toEqual({ id: 'module-1' });
  });

  it('listPipelineStages() returns only the accessible module pipeline', async () => {
    modulesService.listPipelineStagesForCaller.mockResolvedValue([
      { id: 'stage-1', value: 'Analysis' },
    ]);
    const result = await controller.listPipelineStages('module-1', req());
    expect(modulesService.listPipelineStagesForCaller).toHaveBeenCalledWith(
      'module-1',
      'user-1',
    );
    expect(result).toEqual([{ id: 'stage-1', value: 'Analysis' }]);
  });

  it('update() delegates to updateForCaller with the module id, caller id, and body', async () => {
    modulesService.updateForCaller.mockResolvedValue({
      id: 'module-1',
      title: 'Updated',
    });
    const result = await controller.update('module-1', req(), {
      title: 'Updated',
    });
    expect(modulesService.updateForCaller).toHaveBeenCalledWith(
      'module-1',
      'user-1',
      {
        title: 'Updated',
      },
    );
    expect(result).toEqual({ id: 'module-1', title: 'Updated' });
  });

  it('archive() delegates to archiveForCaller with the module id and caller id', async () => {
    modulesService.archiveForCaller.mockResolvedValue({ id: 'module-1' });
    const result = await controller.archive('module-1', req());
    expect(modulesService.archiveForCaller).toHaveBeenCalledWith(
      'module-1',
      'user-1',
    );
    expect(result).toEqual({ id: 'module-1' });
  });
});
