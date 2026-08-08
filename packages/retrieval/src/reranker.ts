export interface RetrievedPassage {
  readonly chunkId: string;
  readonly text: string;
  readonly score: number;
}

// §8.4. A similarity or rerank score is a ranking signal, not a calibrated confidence value — it
// must never be presented to the user as answer confidence (§4.7).
export interface Reranker {
  rerank(
    query: string,
    passages: readonly RetrievedPassage[],
    topN: number,
  ): Promise<readonly RetrievedPassage[]>;
}
