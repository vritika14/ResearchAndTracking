import { MyProjectsController } from './my-projects.controller';
import { ProjectsService } from '../services/projects.service';
import { UsersService } from '../../users/users.service';

describe('MyProjectsController', () => {
  let controller: MyProjectsController;
  let projectsService: {
    listForCaller: jest.Mock;
    findOneForCaller: jest.Mock;
    updateForCaller: jest.Mock;
    archiveForCaller: jest.Mock;
    listPipelineStagesForCaller: jest.Mock;
  };
  let usersService: { findByExternalAuthId: jest.Mock };

  beforeEach(() => {
    projectsService = {
      listForCaller: jest.fn(),
      findOneForCaller: jest.fn(),
      updateForCaller: jest.fn(),
      archiveForCaller: jest.fn(),
      listPipelineStagesForCaller: jest.fn(),
    };
    usersService = {
      findByExternalAuthId: jest.fn().mockResolvedValue({ id: 'user-1' }),
    };
    controller = new MyProjectsController(
      projectsService as unknown as ProjectsService,
      usersService as unknown as UsersService,
    );
  });

  function req() {
    return { user: { sub: 'cognito-sub-1' } } as never;
  }

  it('list() resolves the caller and delegates to listForCaller', async () => {
    projectsService.listForCaller.mockResolvedValue([{ id: 'project-1' }]);
    const result = await controller.list(req());
    expect(usersService.findByExternalAuthId).toHaveBeenCalledWith(
      'cognito-sub-1',
    );
    expect(projectsService.listForCaller).toHaveBeenCalledWith('user-1');
    expect(result).toEqual([{ id: 'project-1' }]);
  });

  it('findOne() delegates to findOneForCaller with the project id and caller id', async () => {
    projectsService.findOneForCaller.mockResolvedValue({ id: 'project-1' });
    const result = await controller.findOne('project-1', req());
    expect(projectsService.findOneForCaller).toHaveBeenCalledWith(
      'project-1',
      'user-1',
    );
    expect(result).toEqual({ id: 'project-1' });
  });

  it('listPipelineStages() returns only the accessible project pipeline', async () => {
    projectsService.listPipelineStagesForCaller.mockResolvedValue([
      { id: 'stage-1', value: 'Analysis' },
    ]);
    const result = await controller.listPipelineStages('project-1', req());
    expect(projectsService.listPipelineStagesForCaller).toHaveBeenCalledWith(
      'project-1',
      'user-1',
    );
    expect(result).toEqual([{ id: 'stage-1', value: 'Analysis' }]);
  });

  it('update() delegates to updateForCaller with the project id, caller id, and body', async () => {
    projectsService.updateForCaller.mockResolvedValue({
      id: 'project-1',
      title: 'Updated',
    });
    const result = await controller.update('project-1', req(), {
      title: 'Updated',
    });
    expect(projectsService.updateForCaller).toHaveBeenCalledWith(
      'project-1',
      'user-1',
      {
        title: 'Updated',
      },
    );
    expect(result).toEqual({ id: 'project-1', title: 'Updated' });
  });

  it('archive() delegates to archiveForCaller with the project id and caller id', async () => {
    projectsService.archiveForCaller.mockResolvedValue({ id: 'project-1' });
    const result = await controller.archive('project-1', req());
    expect(projectsService.archiveForCaller).toHaveBeenCalledWith(
      'project-1',
      'user-1',
    );
    expect(result).toEqual({ id: 'project-1' });
  });
});
