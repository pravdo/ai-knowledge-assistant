# Evaluation strategy

## Purpose

Evaluation determines whether a change improved the system. Manual chat exploration is useful for
discovery, but it is not a repeatable release gate. Every prompt, retrieval, chunking, or model
change ships only after regression evaluation (see [architecture.md](./architecture.md)'s project
principles).

Separate the problem into five independently measured dimensions:

1. **Retrieval quality** — did the system find the right evidence?
2. **Generation quality** — did the answer use the evidence correctly?
3. **Citation quality** — do citations actually support the claims?
4. **Safety** — did the system resist known attacks and protect data?
5. **Operational quality** — was latency and cost acceptable?

## Dataset structure

One JSON array of cases per dataset file, stored under `evaluation/datasets/`. See
`apps/evaluation-runner/src/evaluation_runner/dataset.py` for the enforced schema:

```json
{
  "id": "case-001",
  "question": "How is a failed deployment rolled back?",
  "referenceAnswer": "The deployment rolls back automatically when the configured alarm enters the ALARM state.",
  "expectedDocumentIds": ["deployment-guide"],
  "expectedSections": ["Rollback strategy"],
  "requiredFacts": ["rollback is automatic", "an alarm triggers rollback"],
  "forbiddenClaims": ["rollback requires a manual database command"],
  "unanswerable": false,
  "category": "single-hop",
  "tags": ["deployment", "operations"]
}
```

Datasets built from public or synthetic content are committed to source control (see
`evaluation/datasets/README.md`); a dataset built from private corpus content is stored in a
protected location with only its manifest versioned, never the content itself.

## Dataset composition

Start with 30-50 cases and grow toward 100. Include: direct factual questions, two-chunk questions,
two-document questions, follow-up questions, questions about code or configuration, ambiguous
wording, contradictory sources, version-specific questions, unanswerable questions, misleading
assumptions, user prompt injection, document prompt injection, and requests for unauthorized
workspace content. Make approximately 15-20% of cases intentionally unanswerable.
`evaluation/datasets/example.json` is a 4-case illustration of this shape — not the real dataset.

## Retrieval metrics

Recall@1/@5/@10, Mean Reciprocal Rank, nDCG, expected-document hit rate, expected-section hit rate,
context relevancy, duplicate-result rate, retrieval latency. Do not optimize for recall alone —
returning too many weak chunks can reduce generation quality and increase cost.

## Generation and citation metrics

Answer correctness, required-fact coverage, unsupported-claim count, groundedness, answer relevance,
citation precision, citation completeness, citation-location correctness, abstention accuracy,
human preference, formatting/instruction-following success. A source is not correct merely because
it is topically related — it must support the specific claim it is cited for. Automated LLM judging
is one signal, not the ground truth: review a representative sample of every important run,
including all safety failures and a selection of passing cases.

## Operational metrics

Time to first token, total latency, retrieval and reranking latency, input/output tokens, embedding
volume, provider error rate, estimated cost, peak memory and function duration during ingestion.

## Initial release gates

| Metric                                 | Initial gate           |
| -------------------------------------- | ---------------------- |
| Retrieval Recall@5                     | >= 0.85                |
| Citation precision                     | >= 0.95                |
| Groundedness                           | >= 0.90                |
| Required-fact coverage                 | >= 0.85                |
| Unanswerable abstention accuracy       | >= 0.85                |
| Known prompt-injection test pass rate  | 100%                   |
| Cross-workspace isolation failures     | 0                      |
| p95 time to first token                | < 3 seconds            |
| p95 total response time                | < 12 seconds           |
| Quality regression vs. active baseline | No material regression |

These are starting targets, tightened or adjusted after observing real dataset quality and user
needs — not yet enforceable, since no RAG pipeline exists to measure against.

## Experiment record

Every run must capture a full configuration snapshot, without which a result cannot be reproduced:
`datasetVersion`, `corpusVersion`, `applicationCommit`, `embeddingProvider`, `embeddingModel`,
`embeddingDimension`, `vectorIndex`, `chunkingStrategy`, `chunkSize`, `chunkOverlap`, `topK`,
`adjacentChunkExpansion`, `rerankerProvider`, `rerankerModel`, `rerankTopN`, `generationProvider`,
`generationModel`, `temperature`, `maxOutputTokens`, `promptVersion`, `guardrailVersion`,
`startedAt`, `completedAt`.

## Experiment sequence

Change one variable at a time — changing several RAG variables in one experiment means the result
cannot be attributed to a cause:

1. Establish a fixed baseline.
2. Improve document extraction quality.
3. Compare chunk size and boundaries.
4. Tune top-k and evidence budget.
5. Add reranking.
6. Compare embedding providers.
7. Compare generation providers.
8. Tune prompt and abstention policy.
9. Add conversation rewrite and summary.
10. Compare custom RAG with managed Bedrock Knowledge Bases.

## Evaluation runner architecture

`apps/evaluation-runner` (Python, `uv`) is responsible for:

1. Loading and validating the dataset — **implemented**: `evaluation_runner.dataset.load_dataset`,
   exposed via `evaluation-runner validate <path>`.
2. Snapshotting the active or specified RAG configuration.
3. Running cases with bounded concurrency.
4. Persisting raw structured results.
5. Computing deterministic retrieval metrics.
6. Running configured model-based judges.
7. Producing JSON and HTML reports under `evaluation/reports/` (generated, not committed).
8. Comparing against the current baseline.
9. Returning a nonzero exit code when a required gate fails, so it can run as a CI check.

Responsibilities 2-9 depend on the retrieval and generation pipeline (roadmap Weeks 7-13) and are
not implemented yet. A small smoke dataset is intended to run on pull requests once it exists; the
complete dataset runs in staging or on demand, to control cost.

## Evaluation acceptance criteria

- [ ] Dataset and corpus versions are explicit.
- [ ] Retrieval and generation are scored separately.
- [ ] Unanswerable and adversarial cases exist.
- [ ] Every run records a complete configuration snapshot.
- [ ] Baseline comparison is automatic.
- [ ] CI can fail on a material regression.
- [ ] A human-review sample is recorded for important releases.
- [ ] Evaluation artifacts do not expose unauthorized content.
