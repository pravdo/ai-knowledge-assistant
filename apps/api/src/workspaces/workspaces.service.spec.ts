import type { WorkspaceRecord } from '@ai-knowledge-assistant/contracts';

import { ProblemDetailsException } from '../common/problem-details.exception';
import { WorkspacesService } from './workspaces.service';

function createDeps() {
  const repository = {
    createWithOwner: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn(),
    findManyByIds: jest.fn(),
  };
  const memberships = {
    listForUser: jest.fn(),
    requireRole: jest.fn().mockResolvedValue(undefined),
  };
  return { repository, memberships };
}

describe('WorkspacesService', () => {
  it('create() writes the workspace and the creator OWNER membership in one transaction', async () => {
    const { repository, memberships } = createDeps();
    const service = new WorkspacesService(repository as never, memberships as never);

    const workspace = await service.create({
      name: 'Docs',
      description: 'Engineering docs',
      createdBy: 'user-1',
    });

    expect(workspace.name).toBe('Docs');
    expect(workspace.createdBy).toBe('user-1');
    expect(repository.createWithOwner).toHaveBeenCalledWith(workspace, 'user-1');
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

  it('getById() requires VIEWER access before loading the record', async () => {
    const { repository, memberships } = createDeps();
    const denied = new ProblemDetailsException('WORKSPACE_ACCESS_DENIED', 'nope');
    memberships.requireRole.mockRejectedValue(denied);
    const service = new WorkspacesService(repository as never, memberships as never);

    await expect(service.getById('ws-1', 'user-1')).rejects.toBe(denied);

    expect(memberships.requireRole).toHaveBeenCalledWith('ws-1', 'user-1', 'VIEWER');
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('getById() throws INTERNAL_ERROR if the workspace record is unexpectedly missing', async () => {
    const { repository, memberships } = createDeps();
    repository.findById.mockResolvedValue(null);
    const service = new WorkspacesService(repository as never, memberships as never);

    const error = await service.getById('ws-missing', 'user-1').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ProblemDetailsException);
    expect((error as ProblemDetailsException).code).toBe('INTERNAL_ERROR');
  });
});
