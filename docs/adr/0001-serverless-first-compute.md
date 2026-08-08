# ADR-0001: Serverless-first compute

Status: Accepted
Date: 2026-08-08
Owners: praavdo

## Context

The control-plane API, streaming chat, and document ingestion all need compute. This is a
part-time, evaluation-driven portfolio build, not a system with known sustained traffic — the
priority is fast iteration, low idle cost, and direct exposure to AWS Lambda, API Gateway, and IAM
practice (relevant to the AWS Developer Associate certification target).

## Decision

Start every compute workload on AWS Lambda: the NestJS control-plane API, the lightweight
streaming chat Lambda, and the Python ingestion worker. Do not provision always-on containers or
servers for the first release.

## Alternatives considered

- **ECS/Fargate services** — better for sustained traffic and long-lived connections, but adds
  cluster/service operational surface with no traffic yet to justify it.
- **A single monolithic Lambda for everything** — simpler to deploy, but couples the
  latency-sensitive streaming path to the full NestJS bootstrap and dependency set (see
  [architecture.md](../architecture.md)'s "why separate control-plane and streaming functions").

## Consequences

- Zero idle cost and minimal operational surface while traffic is low or absent.
- Cold starts and the 15-minute Lambda timeout become real constraints for ingestion once
  documents get large or parsing gets heavy.
- API Gateway + Lambda response streaming is a documented, supported pattern for the chat
  endpoint, avoiding a second compute platform just for streaming.

## Revisit triggers

- Ingestion regularly approaches the Lambda timeout, needs native/OCR libraries that make the
  deployment package unwieldy, or one document needs multiple parallel/checkpointed stages — move
  to Step Functions orchestrating Lambda and ECS/Fargate tasks, preserving the same job contract.
- Sustained request volume makes cold starts or provisioned concurrency cost/latency unattractive,
  or the API needs long-lived connections — move the API to a containerized NestJS service.
