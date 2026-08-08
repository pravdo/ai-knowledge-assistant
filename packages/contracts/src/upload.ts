// The upload session the API returns after authorizing a workspace upload (§7.2). The browser
// never supplies the final S3 key; the API derives it from workspace/document/version identifiers.
export interface UploadSession {
  documentId: string;
  uploadId: string;
  method: 'PUT';
  url: string;
  expiresAt: string;
  requiredHeaders: Record<string, string>;
  maximumBytes: number;
}
