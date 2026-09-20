import { getDynamoDocumentClient } from '@ai-knowledge-assistant/aws-clients';
import type { WorkspaceMembership, WorkspaceRole } from '@ai-knowledge-assistant/contracts';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

// Item shape from docs/architecture.md §6.2/§6.3: PK=WORKSPACE#{id}, SK=MEMBER#{userId}, with a
// GSI1 projection (GSI1PK=USER#{userId}) supporting the "list workspaces for a user" access
// pattern without a table scan.
export interface MembershipItem {
  pk: string;
  sk: string;
  gsi1pk: string;
  gsi1sk: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: string;
}

function toMembership(item: MembershipItem): WorkspaceMembership {
  return { workspaceId: item.workspaceId, userId: item.userId, role: item.role };
}

// Exported as a plain builder because a membership is never written on its own: the first OWNER
// is written in the same transaction as its workspace (WorkspacesRepository.createWithOwner).
export function buildMembershipItem(
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
): MembershipItem {
  return {
    pk: `WORKSPACE#${workspaceId}`,
    sk: `MEMBER#${userId}`,
    gsi1pk: `USER#${userId}`,
    gsi1sk: `WORKSPACE#${workspaceId}`,
    workspaceId,
    userId,
    role,
    createdAt: new Date().toISOString(),
  };
}

@Injectable()
export class MembershipsRepository {
  constructor(private readonly config: ConfigService) {}

  private get tableName(): string {
    return this.config.getOrThrow<string>('APP_TABLE_NAME');
  }

  async find(workspaceId: string, userId: string): Promise<WorkspaceMembership | null> {
    const result = await getDynamoDocumentClient().send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: `WORKSPACE#${workspaceId}`, sk: `MEMBER#${userId}` },
      }),
    );

    return result.Item ? toMembership(result.Item as MembershipItem) : null;
  }

  async listForUser(userId: string): Promise<WorkspaceMembership[]> {
    const result = await getDynamoDocumentClient().send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'gsi1',
        KeyConditionExpression: 'gsi1pk = :gsi1pk',
        ExpressionAttributeValues: { ':gsi1pk': `USER#${userId}` },
      }),
    );

    return ((result.Items ?? []) as MembershipItem[]).map(toMembership);
  }
}
