# ADR-0002: Cognito authentication and workspace authorization model

Status: Accepted
Date: 2026-08-08
Owners: praavdo

## Context

The system needs real identity (not a toy auth scheme) and a workspace-scoped authorization model
with three roles (owner, editor, viewer). "Do not start with the model call" — identity and
authorization are the first trust boundary, ahead of retrieval or generation
([architecture.md](../architecture.md)).

## Decision

Use Amazon Cognito as the identity provider, with the Angular SPA performing OIDC Authorization
Code with PKCE (no client secret in the browser, no manually implemented OAuth exchange). Cognito
issues identity; it does not represent workspace authorization. Workspace membership and role
(`VIEWER` | `EDITOR` | `OWNER`) are stored as application records in DynamoDB and loaded
server-side by the NestJS API on every workspace request
(`WorkspaceAuthorizer.requireRole`, backed by `packages/domain`'s role-comparison helper). A user is
never authorized for a workspace by the mere fact of knowing its ID.

## Alternatives considered

- **A custom authentication protocol** — explicitly out of scope; reinventing token issuance and
  session handling is unnecessary risk for no product benefit.
- **Cognito groups for workspace roles** — Cognito groups suit a small number of _global_ roles,
  not per-workspace membership with many workspaces per user; groups would require a group-per-
  workspace explosion.
- **Deriving workspace access from the URL alone** — rejected outright; this is exactly the
  cross-workspace access vulnerability the threat model calls out.

## Consequences

- Real OIDC/PKCE and JWT-authorizer practice, directly relevant to the AWS Developer Associate
  target.
- Every workspace-scoped endpoint requires an explicit membership lookup before touching a
  resource, adding one DynamoDB read per request but closing the primary cross-tenant risk.
- Workspace invitations and more granular sharing are deferred (see the "later enhancements" scope
  in the source blueprint).

## Revisit triggers

- Enterprise SSO (SAML/OIDC federation from a customer IdP) becomes a real requirement — Cognito
  supports federation, but the SPA's login flow and any assumptions about a single user pool would
  need review.
- Regulatory isolation requires per-tenant AWS accounts, connection pools, or vector-index
  separation rather than application-level row filtering.
