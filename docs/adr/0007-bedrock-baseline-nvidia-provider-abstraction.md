# ADR-0007: Bedrock baseline generation/embedding, with a provider-abstraction boundary for NVIDIA

Status: Accepted
Date: 2026-08-09
Owners: praavdo

## Context

The project targets both the AWS Developer Associate and NVIDIA NCA-GENL certifications, which
means two model providers need real, working integrations — not just one hard-coded choice. But
the orchestration logic (evidence selection, prompt construction, citation validation, streaming)
should not be duplicated per provider, and should not be so abstracted that it hides genuinely
provider-specific capabilities (project principle: "provider abstraction, not provider denial").

## Decision

Amazon Bedrock is the baseline provider for embeddings, generation (`ConverseStream`), and
guardrails — it is what the application ships with first and is evaluated against. NVIDIA NIM
(generation) and NeMo Retriever (embedding and reranking) are added as a second, swappable
implementation behind the same small interfaces: `EmbeddingProvider` / `GenerationProvider` in
`packages/model-providers`, `VectorStore` / `Reranker` in `packages/retrieval`. Provider adapters own
provider-specific request/response types, retries, and error mapping; the orchestration layer in
`apps/chat-stream` depends only on these interfaces, never on a provider SDK directly. Self-hosting
NVIDIA NIM on GPU infrastructure is an explicit stretch goal, not part of the baseline — first prove
the application against an accessible hosted endpoint.

## Alternatives considered

- **NVIDIA as the baseline instead of Bedrock** — Bedrock's tighter integration with the rest of the
  AWS stack (IAM, guardrails, `ConverseStream`) makes it the lower-friction baseline; NVIDIA is
  still fully exercised as the comparison provider by Week 14.
- **No shared interface, provider-specific code paths throughout** — would let each provider use
  its full native capability set, but duplicates the orchestration logic (context budgeting, prompt
  construction, citation validation) once per provider, and makes the Week 14 comparison much
  harder to run fairly.

## Consequences

- Every RAG configuration (`packages/contracts`'s `RagConfiguration`) names its provider per stage
  (embedding, reranking, generation), so a workspace can run a mixed configuration (e.g., Bedrock
  generation with NVIDIA reranking) and the evaluation dataset can compare all four configurations
  described in the source blueprint's provider comparison matrix.
- Model access, region support, context limits, and streaming support are validated at deployment
  or configuration-activation time — arbitrary model IDs are never exposed to the browser.
- `packages/testing`'s fake providers implement the same interfaces, so the chat orchestration is
  unit-testable without any real provider credentials.

## Revisit triggers

- A provider comparison (Week 14, [evaluation-strategy.md](../evaluation-strategy.md)) demonstrates
  materially better quality, cost, latency, or deployment control from a provider not currently
  integrated.
- Self-hosting NIM proves necessary for cost or latency reasons — at that point the adapter's
  networking, GPU capacity, patching, metrics, and scaling become real operational surface, not a
  configuration change.
