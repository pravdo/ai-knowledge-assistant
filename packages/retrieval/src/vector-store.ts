// Kept small: vector content per record mirrors §6.6 (no full chunk text — that lives in
// DynamoDB/S3 and is loaded after retrieval).
export interface VectorRecord {
  readonly key: string;
  readonly embedding: readonly number[];
  readonly workspaceId: string;
  readonly documentId: string;
  readonly documentVersion: number;
  readonly chunkId: string;
  readonly page?: number;
  readonly section?: string;
  readonly pipelineVersion: string;
}

export interface VectorQuery {
  readonly embedding: readonly number[];
  readonly workspaceId: string;
  readonly topK: number;
  readonly vectorIndex: string;
}

export interface VectorMatch {
  readonly key: string;
  readonly score: number;
  readonly documentId: string;
  readonly documentVersion: number;
  readonly chunkId: string;
  readonly page?: number;
  readonly section?: string;
}

// §8.4. `query` must always apply the mandatory workspace filter server-side — the model or
// client never selects it (§9.1 Prompt-injection defense, §Authorization before retrieval).
export interface VectorStore {
  upsert(items: readonly VectorRecord[]): Promise<void>;
  query(request: VectorQuery): Promise<readonly VectorMatch[]>;
  delete(keys: readonly string[]): Promise<void>;
}
