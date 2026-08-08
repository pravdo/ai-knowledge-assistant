# ADR-0003: Direct-to-S3 upload

Status: Accepted
Date: 2026-08-08
Owners: praavdo

## Context

Documents can be large enough that routing every byte through the NestJS API Lambda wastes
compute time and money, and risks the Lambda payload/timeout limits. The API must still control
exactly where and how a file lands — the browser cannot be trusted with an arbitrary S3 key.

## Decision

The API creates the document record first, derives the exact S3 object key from
workspace/document/source-version identifiers, and returns a short-lived presigned `PUT` URL with
required headers (content type, checksum) and a maximum byte size
(`packages/aws-clients`'s `createPresignedUpload`). The browser uploads directly to S3 using that
URL. The user never supplies the final object key, and the presigned request is scoped to one exact
key, one HTTP method, and a short expiration.

## Alternatives considered

- **Proxying uploads through the API Lambda** — simplest to reason about, but burns Lambda duration
  and memory on pure byte-shuffling and hits payload-size limits well before realistic document
  sizes.
- **Client-chosen object keys** — rejected; this is exactly the "trusting client-provided S3 keys"
  mistake called out in [operations-runbook.md](../operations-runbook.md)'s common-mistakes list,
  and would let one user overwrite another's objects.

## Consequences

- Client-side validation (extension, MIME type, size) is only for user experience; the ingestion
  worker's own validation (actual file-signature detection, checksum, parser allowlist) is the real
  security control, per the trust boundary in [architecture.md](../architecture.md).
- The upload flow needs a distinct `UPLOADING`/`UPLOADED` state pair in the document state machine
  (`packages/domain/src/document-state.ts`) to represent "presigned URL issued" vs. "S3 confirms the
  object exists," since the API cannot observe the browser's upload directly.

## Revisit triggers

- A future requirement for server-side content transformation on upload (e.g., mandatory
  virus-scanning before the object is even accepted) would require routing back through compute, at
  least for a scanning step ahead of the final S3 write.
