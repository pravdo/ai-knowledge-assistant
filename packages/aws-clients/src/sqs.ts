import { SQSClient } from '@aws-sdk/client-sqs';

let sqsClient: SQSClient | undefined;

export function getSqsClient(): SQSClient {
  sqsClient ??= new SQSClient({});
  return sqsClient;
}
