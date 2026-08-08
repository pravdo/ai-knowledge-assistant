import { WORKSPACE_ROLES, type WorkspaceRole } from '@ai-knowledge-assistant/contracts';

const ROLE_RANK: Readonly<Record<WorkspaceRole, number>> = Object.fromEntries(
  WORKSPACE_ROLES.map((role, index) => [role, index]),
) as Record<WorkspaceRole, number>;

// True when `actual` meets or exceeds `required` (VIEWER < EDITOR < OWNER). Never authorize a
// workspace use case by checking only that the requester knows a resource ID — always compare
// their loaded membership role against the minimum role the endpoint requires (§5.4).
export function roleSatisfies(actual: WorkspaceRole, required: WorkspaceRole): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required];
}
