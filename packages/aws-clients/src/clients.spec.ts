import { describe, expect, it } from 'vitest';

import { getBedrockRuntimeClient } from './bedrock.js';
import { getDynamoDocumentClient } from './dynamo.js';
import { getS3Client } from './s3.js';
import { getSecretsManagerClient } from './secrets-manager.js';
import { getSqsClient } from './sqs.js';

// Each getter must return the same client instance across calls so Lambda execution environments
// and long-lived server processes reuse one connection instead of reconnecting every time (§10.2).
describe('client singletons', () => {
  it.each([
    ['getS3Client', getS3Client],
    ['getSqsClient', getSqsClient],
    ['getBedrockRuntimeClient', getBedrockRuntimeClient],
    ['getSecretsManagerClient', getSecretsManagerClient],
    ['getDynamoDocumentClient', getDynamoDocumentClient],
  ] as const)('%s returns the same instance on every call', (_name, getClient) => {
    expect(getClient()).toBe(getClient());
  });
});
