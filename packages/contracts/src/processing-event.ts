// The event an S3 upload produces via EventBridge, and that the ingestion worker consumes off SQS
// (Appendix A.2). S3 delivers at-least-once, so consumers must be idempotent on this shape.
export interface DocumentProcessingEvent {
  eventVersion: number;
  eventId: string;
  eventType: 'DocumentUploaded';
  occurredAt: string;
  correlationId: string;
  workspaceId: string;
  documentId: string;
  sourceVersion: number;
  bucket: string;
  key: string;
  objectVersionId: string;
  sha256: string;
}
