import { roleSatisfies } from '@ai-knowledge-assistant/domain';
import type { WorkspaceMembership, WorkspaceRole } from '@ai-knowledge-assistant/contracts';
import { Injectable } from '@nestjs/common';

import { ProblemDetailsException } from '../common/problem-details.exception.js';
import { MembershipsRepository } from './memberships.repository.js';

// §5.4: every workspace use case authorizes through this sequence — load membership, verify the
// required role. Never authorize on the presence of a workspace/document ID alone.
@Injectable()
export class MembershipsService {
  constructor(private readonly repository: MembershipsRepository) {}

  async requireRole(
    workspaceId: string,
    userId: string,
    minimumRole: WorkspaceRole,
  ): Promise<WorkspaceMembership> {
    const membership = await this.repository.find(workspaceId, userId);

    if (!membership) {
      throw new ProblemDetailsException(
        'WORKSPACE_ACCESS_DENIED',
        'You do not have access to this workspace.',
      );
    }
    if (!roleSatisfies(membership.role, minimumRole)) {
      throw new ProblemDetailsException(
        'ROLE_REQUIRED',
        `This action requires the ${minimumRole} role or higher.`,
      );
    }

    return membership;
  }

  createOwnerMembership(workspaceId: string, userId: string): Promise<void> {
    return this.repository.create(workspaceId, userId, 'OWNER');
  }

  listForUser(userId: string): Promise<WorkspaceMembership[]> {
    return this.repository.listForUser(userId);
  }
}
