import { beforeEach, describe, expect, it, vi } from 'vitest';

// getSignedUrl resolves AWS credentials to compute the SigV4 signature even though it makes no
// network call; mock it so this test does not depend on the environment having AWS credentials.
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://example-bucket.s3.amazonaws.com/signed'),
}));

import { createPresignedUpload } from './presign.js';

describe('createPresignedUpload', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-10T09:00:00Z'));
  });

  it('returns the signed URL and an expiresAt timestamp offset by expiresInSeconds', async () => {
    const result = await createPresignedUpload({
      bucket: 'document-bucket',
      key: 'source/tenants/ws-7/doc-123/2/deployment-guide.pdf',
      contentType: 'application/pdf',
      checksumSha256: 'abc123',
      expiresInSeconds: 300,
    });

    expect(result.url).toBe('https://example-bucket.s3.amazonaws.com/signed');
    expect(result.expiresAt).toBe('2026-08-10T09:05:00.000Z');
  });
});
