import type { WorkspaceRecord } from '@ai-knowledge-assistant/contracts';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { ProblemDetailsException } from '../common/problem-details.exception.js';
import { MembershipsService } from '../memberships/memberships.service.js';
import { WorkspacesRepository } from './workspaces.repository.js';

export interface CreateWorkspaceInput {
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

    await this.repository.create(workspace);
    // The creator is always the first OWNER (§1.3 Journey A).
    await this.memberships.createOwnerMembership(workspace.workspaceId, input.createdBy);

    return workspace;
  }

  listForUser(userId: string): Promise<WorkspaceRecord[]> {
    return this.memberships
      .listForUser(userId)
      .then((memberships) => this.repository.findManyByIds(memberships.map((m) => m.workspaceId)));
  }

  // Callers must authorize via MembershipsService.requireRole() first — this does not check
  // access itself, it only loads the record (and guards an invariant, see below).
  async getById(workspaceId: string): Promise<WorkspaceRecord> {
    const workspace = await this.repository.findById(workspaceId);
    if (!workspace) {
      // The caller's membership check guarantees a workspace exists — reaching this means the
      // two records have gone out of sync, not a normal 404.
      throw new ProblemDetailsException(
        'INTERNAL_ERROR',
        'Workspace record is missing despite an active membership.',
      );
    }
    return workspace;
  }
}
