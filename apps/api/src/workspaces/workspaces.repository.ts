import { getDynamoDocumentClient } from '@ai-knowledge-assistant/aws-clients';
import type { WorkspaceRecord } from '@ai-knowledge-assistant/contracts';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BatchGetCommand, GetCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';

import { buildMembershipItem } from '../memberships/memberships.repository.js';

const BATCH_GET_MAX_KEYS = 100;
const BATCH_GET_MAX_ATTEMPTS = 3;
const BATCH_GET_BASE_RETRY_MS = 50;

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

// Item shape from docs/architecture.md §6.2/§6.3: PK=WORKSPACE#{id}, SK=META.
interface WorkspaceItem {
  pk: string;
  sk: string;
  workspaceId: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

function toWorkspaceRecord(item: WorkspaceItem): WorkspaceRecord {
  return {
    workspaceId: item.workspaceId,
    name: item.name,
    description: item.description,
    createdBy: item.createdBy,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

@Injectable()
export class WorkspacesRepository {
  constructor(private readonly config: ConfigService) {}

  private get tableName(): string {
    return this.config.getOrThrow<string>('APP_TABLE_NAME');
  }

  // One transaction, not two writes: a workspace whose OWNER membership failed to persist would
  // be invisible to every user including its creator, and impossible to delete through the API.
  async createWithOwner(workspace: WorkspaceRecord, ownerUserId: string): Promise<void> {
    const workspaceItem: WorkspaceItem = {
      pk: `WORKSPACE#${workspace.workspaceId}`,
      sk: 'META',
      ...workspace,
    };

    await getDynamoDocumentClient().send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: this.tableName,
              Item: workspaceItem,
              ConditionExpression: 'attribute_not_exists(pk)',
            },
          },
          {
            Put: {
              TableName: this.tableName,
              Item: buildMembershipItem(workspace.workspaceId, ownerUserId, 'OWNER'),
              ConditionExpression: 'attribute_not_exists(pk)',
            },
          },
        ],
      }),
    );
  }

  async findById(workspaceId: string): Promise<WorkspaceRecord | null> {
    const result = await getDynamoDocumentClient().send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: `WORKSPACE#${workspaceId}`, sk: 'META' },
      }),
    );

    return result.Item ? toWorkspaceRecord(result.Item as WorkspaceItem) : null;
  }

  async findManyByIds(workspaceIds: readonly string[]): Promise<WorkspaceRecord[]> {
    const items: WorkspaceItem[] = [];

    // BatchGetItem accepts at most 100 keys per call, so a user in more than 100 workspaces needs
    // more than one request.
    for (let start = 0; start < workspaceIds.length; start += BATCH_GET_MAX_KEYS) {
      const keys = workspaceIds
        .slice(start, start + BATCH_GET_MAX_KEYS)
        .map((workspaceId) => ({ pk: `WORKSPACE#${workspaceId}`, sk: 'META' }));
      items.push(...(await this.batchGet(keys)));
    }

    return items.map(toWorkspaceRecord);
  }

  // Throttling (or a response over 16MB) makes BatchGetItem return the leftovers in
  // UnprocessedKeys rather than failing, so ignoring them would silently drop workspaces from the
  // caller's list — a wrong answer served as a success.
  private async batchGet(keys: ReadonlyArray<Record<string, string>>): Promise<WorkspaceItem[]> {
    const items: WorkspaceItem[] = [];
    let pending = [...keys];

    for (let attempt = 0; pending.length > 0 && attempt < BATCH_GET_MAX_ATTEMPTS; attempt += 1) {
      if (attempt > 0) {
        await delay(BATCH_GET_BASE_RETRY_MS * 2 ** (attempt - 1));
      }

      const result = await getDynamoDocumentClient().send(
        new BatchGetCommand({ RequestItems: { [this.tableName]: { Keys: pending } } }),
      );

      items.push(...((result.Responses?.[this.tableName] ?? []) as WorkspaceItem[]));
      pending = (result.UnprocessedKeys?.[this.tableName]?.Keys ?? []) as Record<string, string>[];
    }

    if (pending.length > 0) {
      throw new Error(
        `DynamoDB left ${pending.length} workspace key(s) unprocessed after ${BATCH_GET_MAX_ATTEMPTS} attempts.`,
      );
    }

    return items;
  }
}
