# ADR-0009: Public or synthetic content only for the portfolio corpus

Status: Accepted
Date: 2026-08-09
Owners: praavdo

## Context

This project is built and demoed as a public portfolio artifact — deployed to a personal AWS
account, with a repository, recorded demo, and evaluation report intended to be shown to others.
Any real employer-confidential or personal data placed into it would be a policy and, in some
cases, legal problem, independent of how well the application's own access controls work.

## Decision

Only public or synthetic material is ever ingested: public AWS/NVIDIA documentation excerpts,
Angular/NestJS documentation, OpenAPI specs, architecture decision records, runbooks, deployment
guides, example READMEs, and synthetic troubleshooting notes — the exact seed list in
[architecture.md](../architecture.md)'s target use case. `evaluation/datasets/`'s example dataset
follows the same policy: every question, reference answer, and expected document reference is
about this synthetic "deployment guide / operations runbook" corpus, never about real systems.
Confidential company documents require approved accounts, contracts, and access controls that are
explicitly out of scope for this project.

## Alternatives considered

- **Using real work documents "just for local testing"** — rejected outright; the source blueprint
  calls this out directly ("do not place employer-confidential information in a personal cloud
  account or third-party model service without explicit authorization"), and local-only usage does
  not eliminate the exposure once documents are embedded and indexed.
- **A fully generic, non-technical demo corpus** — would be safer still, but a bounded _engineering_
  domain is what makes evaluation possible in the first place (architecture.md: "a general-purpose
  assistant is much harder to test because there is no stable source of truth").

## Consequences

- The corpus is inherently bounded and low-stakes, which is also what makes retrieval and
  groundedness evaluation tractable — see the "bounded domain" rationale in
  [architecture.md](../architecture.md).
- Verbose content logging (full prompts/documents) is permitted only in isolated development
  environments using this public/synthetic data, per
  [threat-model.md](../threat-model.md)'s logging policy — never in a shared or production-like
  environment regardless of corpus content.
- Anyone extending this project with real internal documents must consciously override this policy
  and put the corresponding access controls and agreements in place first.

## Revisit triggers

- None expected for the portfolio scope. If this project is ever adapted for real internal use at
  an organization, this ADR must be explicitly superseded with the organization's actual data
  handling and access-control requirements before any real document is ingested.
