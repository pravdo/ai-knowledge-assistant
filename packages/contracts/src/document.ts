// Recommended document states from docs/architecture.md §Reliability §Document state machine.
export const DOCUMENT_STATUSES = [
  'CREATED',
  'UPLOADING',
  'UPLOADED',
  'QUEUED',
  'PROCESSING',
  'READY',
  'FAILED',
  'REPROCESSING',
  'DELETING',
  'DELETED',
] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export interface DocumentRecord {
  documentId: string;
  workspaceId: string;
  originalFileName: string;
  safeDisplayName: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
  sourceS3Key: string;
  status: DocumentStatus;
  activeVersion: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  entityVersion: number;
}

export type ProcessingVersionStatus = 'PROCESSING' | 'ACTIVE' | 'RETIRED' | 'FAILED';

export interface ProcessingVersionRecord {
  documentId: string;
  version: number;
  sourceVersionId: string;
  parserVersion: string;
  chunkingVersion: string;
  embeddingProvider: string;
  embeddingModel: string;
  embeddingDimension: number;
  vectorIndexName: string;
  chunkCount: number;
  manifestS3Key: string;
  status: ProcessingVersionStatus;
}
