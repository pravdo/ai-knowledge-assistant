import { getDynamoDocumentClient } from '@ai-knowledge-assistant/aws-clients';
import type { WorkspaceRecord } from '@ai-knowledge-assistant/contracts';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BatchGetCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

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

  async create(workspace: WorkspaceRecord): Promise<void> {
    const item: WorkspaceItem = {
      pk: `WORKSPACE#${workspace.workspaceId}`,
      sk: 'META',
      ...workspace,
    };

    await getDynamoDocumentClient().send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
        ConditionExpression: 'attribute_not_exists(pk)',
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
    if (workspaceIds.length === 0) {
      return [];
    }

    const result = await getDynamoDocumentClient().send(
      new BatchGetCommand({
        RequestItems: {
          [this.tableName]: {
            Keys: workspaceIds.map((workspaceId) => ({
              pk: `WORKSPACE#${workspaceId}`,
              sk: 'META',
            })),
          },
        },
      }),
    );

    const items = (result.Responses?.[this.tableName] ?? []) as WorkspaceItem[];
    return items.map(toWorkspaceRecord);
  }
}
