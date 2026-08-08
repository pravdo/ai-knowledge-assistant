import { describe, expect, it } from 'vitest';

import { FakeEmbeddingProvider } from './fake-embedding-provider.js';
import { FakeVectorStore } from './fake-vector-store.js';

describe('FakeVectorStore', () => {
  it('never returns matches from another workspace', async () => {
    const embed = new FakeEmbeddingProvider();
    const store = new FakeVectorStore();
    const [ownVector, otherVector] = await embed.embed(['rollback procedure', 'unrelated text']);

    await store.upsert([
      {
        key: 'own',
        embedding: ownVector as number[],
        workspaceId: 'ws-1',
        documentId: 'doc-1',
        documentVersion: 1,
        chunkId: 'chunk-1',
        pipelineVersion: 'v1',
      },
      {
        key: 'other',
        embedding: otherVector as number[],
        workspaceId: 'ws-2',
        documentId: 'doc-2',
        documentVersion: 1,
        chunkId: 'chunk-2',
        pipelineVersion: 'v1',
      },
    ]);

    const matches = await store.query({
      embedding: ownVector as number[],
      workspaceId: 'ws-1',
      topK: 5,
      vectorIndex: 'aka-dev-fake-v1',
    });

    expect(matches).toHaveLength(1);
    expect(matches[0]?.key).toBe('own');
  });

  it('stops returning a deleted key', async () => {
    const embed = new FakeEmbeddingProvider();
    const store = new FakeVectorStore();
    const [vector] = await embed.embed(['deployment guide']);

    await store.upsert([
      {
        key: 'to-delete',
        embedding: vector as number[],
        workspaceId: 'ws-1',
        documentId: 'doc-1',
        documentVersion: 1,
        chunkId: 'chunk-1',
        pipelineVersion: 'v1',
      },
    ]);
    await store.delete(['to-delete']);

    const matches = await store.query({
      embedding: vector as number[],
      workspaceId: 'ws-1',
      topK: 5,
      vectorIndex: 'aka-dev-fake-v1',
    });

    expect(matches).toHaveLength(0);
  });
});
