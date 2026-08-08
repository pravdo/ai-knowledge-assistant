import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

let documentClient: DynamoDBDocumentClient | undefined;

// Module-level singleton so Lambda execution environments and the NestJS process reuse one
// connection instead of reconnecting per invocation/request (§10.2 Lambda practices).
export function getDynamoDocumentClient(): DynamoDBDocumentClient {
  documentClient ??= DynamoDBDocumentClient.from(new DynamoDBClient({}), {
    marshallOptions: { removeUndefinedValues: true },
  });
  return documentClient;
}
