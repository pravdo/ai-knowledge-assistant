import type { Reranker, RetrievedPassage } from '@ai-knowledge-assistant/retrieval';

// Passes through the existing scores and truncates to topN, so tests can exercise the reranking
// step in the pipeline without depending on a real reranker (§13.5).
export class FakeReranker implements Reranker {
  rerank(
    _query: string,
    passages: readonly RetrievedPassage[],
    topN: number,
  ): Promise<readonly RetrievedPassage[]> {
    const ranked = [...passages].sort((a, b) => b.score - a.score).slice(0, topN);
    return Promise.resolve(ranked);
  }
}
