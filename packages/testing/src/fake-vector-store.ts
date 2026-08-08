import type {
  VectorMatch,
  VectorQuery,
  VectorRecord,
  VectorStore,
} from '@ai-knowledge-assistant/retrieval';

function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  for (let index = 0; index < a.length; index += 1) {
    const valueA = a[index] ?? 0;
    const valueB = b[index] ?? 0;
    dot += valueA * valueB;
    magnitudeA += valueA * valueA;
    magnitudeB += valueB * valueB;
  }
  const denominator = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
  return denominator === 0 ? 0 : dot / denominator;
}

// In-memory VectorStore for local development and unit tests (§13.5). Still enforces the
// mandatory workspace filter so tests exercise the same isolation guarantee as production.
export class FakeVectorStore implements VectorStore {
  private readonly records = new Map<string, VectorRecord>();

  upsert(items: readonly VectorRecord[]): Promise<void> {
    for (const item of items) {
      this.records.set(item.key, item);
    }
    return Promise.resolve();
  }

  query(request: VectorQuery): Promise<readonly VectorMatch[]> {
    const matches: VectorMatch[] = [...this.records.values()]
      .filter((record) => record.workspaceId === request.workspaceId)
      .map((record) => ({
        key: record.key,
        score: cosineSimilarity(record.embedding, request.embedding),
        documentId: record.documentId,
        documentVersion: record.documentVersion,
        chunkId: record.chunkId,
        page: record.page,
        section: record.section,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, request.topK);
    return Promise.resolve(matches);
  }

  delete(keys: readonly string[]): Promise<void> {
    for (const key of keys) {
      this.records.delete(key);
    }
    return Promise.resolve();
  }
}
