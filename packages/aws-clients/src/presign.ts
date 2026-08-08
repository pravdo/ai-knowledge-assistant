import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { getS3Client } from './s3.js';

export interface PresignedUpload {
  url: string;
  expiresAt: string;
}

// A short-lived PUT URL for one exact object key (§7.2, §7.3). Callers must always pass the exact
// key the API generated server-side — never let a client choose or influence the object key.
export async function createPresignedUpload(params: {
  bucket: string;
  key: string;
  contentType: string;
  checksumSha256: string;
  expiresInSeconds: number;
}): Promise<PresignedUpload> {
  const command = new PutObjectCommand({
    Bucket: params.bucket,
    Key: params.key,
    ContentType: params.contentType,
    ChecksumSHA256: params.checksumSha256,
  });
  const url = await getSignedUrl(getS3Client(), command, {
    expiresIn: params.expiresInSeconds,
  });
  return {
    url,
    expiresAt: new Date(Date.now() + params.expiresInSeconds * 1000).toISOString(),
  };
}
