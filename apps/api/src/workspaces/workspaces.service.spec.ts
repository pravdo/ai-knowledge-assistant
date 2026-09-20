import type { WorkspaceRecord } from '@ai-knowledge-assistant/contracts';

import { ProblemDetailsException } from '../common/problem-details.exception';
import { WorkspacesService } from './workspaces.service';

function createDeps() {
  const repository = {
    create: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn(),
    findManyByIds: jest.fn(),
  };
  const memberships = {
    createOwnerMembership: jest.fn().mockResolvedValue(undefined),
    listForUser: jest.fn(),
  };
  return { repository, memberships };
}

describe('WorkspacesService', () => {
  it('create() persists the workspace and grants the creator OWNER membership', async () => {
    const { repository, memberships } = createDeps();
    const service = new WorkspacesService(repository as never, memberships as never);

    const workspace = await service.create({
      name: 'Docs',
      description: 'Engineering docs',
      createdBy: 'user-1',
    });

    expect(workspace.name).toBe('Docs');
    expect(workspace.createdBy).toBe('user-1');
    expect(repository.create).toHaveBeenCalledWith(workspace);
    expect(memberships.createOwnerMembership).toHaveBeenCalledWith(workspace.workspaceId, 'user-1');
  });

  it('listForUser() resolves membership workspace IDs to workspace records', async () => {
    const { repository, memberships } = createDeps();
    memberships.listForUser.mockResolvedValue([
      { workspaceId: 'ws-1', userId: 'user-1', role: 'OWNER' },
      { workspaceId: 'ws-2', userId: 'user-1', role: 'VIEWER' },
    ]);
    const records: WorkspaceRecord[] = [
      {
        workspaceId: 'ws-1',
        name: 'A',
        description: '',
        createdBy: 'user-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    repository.findManyByIds.mockResolvedValue(records);
    const service = new WorkspacesService(repository as never, memberships as never);

    const result = await service.listForUser('user-1');

    expect(repository.findManyByIds).toHaveBeenCalledWith(['ws-1', 'ws-2']);
    expect(result).toBe(records);
  });

  it('getById() throws INTERNAL_ERROR if the workspace record is unexpectedly missing', async () => {
    const { repository, memberships } = createDeps();
    repository.findById.mockResolvedValue(null);
    const service = new WorkspacesService(repository as never, memberships as never);

    const error = await service.getById('ws-missing').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ProblemDetailsException);
    expect((error as ProblemDetailsException).code).toBe('INTERNAL_ERROR');
  });
});
