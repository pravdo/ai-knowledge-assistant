import type { WorkspaceMembership } from '@ai-knowledge-assistant/contracts';

import { ProblemDetailsException } from '../common/problem-details.exception';
import { MembershipsService } from './memberships.service';

function createRepository(membership: WorkspaceMembership | null) {
  return {
    find: jest.fn().mockResolvedValue(membership),
    create: jest.fn(),
    listForUser: jest.fn(),
  };
}

describe('MembershipsService.requireRole', () => {
  it('throws WORKSPACE_ACCESS_DENIED when the user has no membership', async () => {
    const repository = createRepository(null);
    const service = new MembershipsService(repository as never);

    const error = await service.requireRole('ws-1', 'user-1', 'VIEWER').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ProblemDetailsException);
    expect((error as ProblemDetailsException).code).toBe('WORKSPACE_ACCESS_DENIED');
  });

  it('throws ROLE_REQUIRED when the membership role is too low', async () => {
    const repository = createRepository({ workspaceId: 'ws-1', userId: 'user-1', role: 'VIEWER' });
    const service = new MembershipsService(repository as never);

    const error = await service.requireRole('ws-1', 'user-1', 'OWNER').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ProblemDetailsException);
    expect((error as ProblemDetailsException).code).toBe('ROLE_REQUIRED');
  });

  it('returns the membership when the role is sufficient', async () => {
    const membership: WorkspaceMembership = {
      workspaceId: 'ws-1',
      userId: 'user-1',
      role: 'OWNER',
    };
    const repository = createRepository(membership);
    const service = new MembershipsService(repository as never);

    await expect(service.requireRole('ws-1', 'user-1', 'VIEWER')).resolves.toEqual(membership);
  });
});
