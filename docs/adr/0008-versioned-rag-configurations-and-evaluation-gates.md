# ADR-0008: Versioned RAG configurations, activated only after evaluation gates pass

Status: Accepted
Date: 2026-08-09
Owners: praavdo

## Context

Chunking, retrieval, reranking, generation, prompt, and guardrail settings change frequently during
development and directly affect answer quality and safety. If these live as ordinary environment
variables, a change can't be attributed to a specific, reproducible configuration, can't be rolled
back independently of a code deploy, and has no gate preventing a quality or safety regression from
reaching users.

## Decision

A RAG configuration (`packages/contracts`'s `RagConfiguration`: embedding, retrieval, reranking,
generation, prompt version, guardrail version) is versioned application data stored per workspace,
with an explicit lifecycle: `CANDIDATE` → `ACTIVE` → `RETIRED`. A new version is created as a
candidate, evaluated against the versioned dataset (`apps/evaluation-runner`), and only promoted to
`ACTIVE` if it passes the release gates in
[evaluation-strategy.md](../evaluation-strategy.md) — no material regression against the current
baseline, and 100% pass rate on known prompt-injection cases. The previous active configuration
remains available for immediate rollback without a code deployment. Every stored chat message
records the configuration version that produced it, so past answers remain attributable.

## Alternatives considered

- **Environment variables per environment** — simplest to wire up, but conflates deployment
  (infrastructure) with configuration (application data), and gives no natural place to attach an
  evaluation result or a rollback history.
- **A single mutable "current settings" record** — no way to know what configuration produced a
  given past answer, and no rollback path other than manually re-entering the previous values.

## Consequences

- Promoting a RAG configuration change requires running the evaluation suite first — this is
  intentional friction; it is the mechanism that prevents "shipping a model or prompt change
  without regression evaluation" (a listed common mistake).
- Every RAG-affecting service call must read the _active_ configuration server-side; a client can
  never select a provider, model, or prompt version directly (§8.2's chat request contract
  deliberately omits these fields).
- Rollback of a bad RAG release is a configuration-activation change, not a redeploy — directly
  supporting the "bad RAG release" runbook in [operations-runbook.md](../operations-runbook.md).

## Revisit triggers

- The evaluation gates prove too strict or too loose in practice once real usage data exists —
  thresholds are explicitly starting targets, tightened or loosened after measurement.
