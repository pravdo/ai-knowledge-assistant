import type { WorkspaceRecord } from '@ai-knowledge-assistant/contracts';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { ProblemDetailsException } from '../common/problem-details.exception.js';
import { MembershipsService } from '../memberships/memberships.service.js';
import { WorkspacesRepository } from './workspaces.repository.js';

interface CreateWorkspaceInput {
  readonly name: string;
  readonly description: string;
  readonly createdBy: string;
}

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly repository: WorkspacesRepository,
    private readonly memberships: MembershipsService,
  ) {}

  async create(input: CreateWorkspaceInput): Promise<WorkspaceRecord> {
    const now = new Date().toISOString();
    const workspace: WorkspaceRecord = {
      workspaceId: randomUUID(),
      name: input.name,
      description: input.description,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    // The creator is always the first OWNER (§1.3 Journey A), written in the same transaction.
    await this.repository.createWithOwner(workspace, input.createdBy);

    return workspace;
  }

  async listForUser(userId: string): Promise<WorkspaceRecord[]> {
    const memberships = await this.memberships.listForUser(userId);
    return this.repository.findManyByIds(memberships.map((membership) => membership.workspaceId));
  }

  // §5.4: authorization lives in the use case, not the controller, so no caller can skip it.
  async getById(workspaceId: string, userId: string): Promise<WorkspaceRecord> {
    await this.memberships.requireRole(workspaceId, userId, 'VIEWER');

    const workspace = await this.repository.findById(workspaceId);
    if (!workspace) {
      // A membership exists, so the workspace must too — reaching this means the two records
      // have gone out of sync, not a normal 404.
      throw new ProblemDetailsException(
        'INTERNAL_ERROR',
        'Workspace record is missing despite an active membership.',
      );
    }
    return workspace;
  }
}
