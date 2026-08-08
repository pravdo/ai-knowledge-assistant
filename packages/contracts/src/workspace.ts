// Roles are ordered weakest to strongest; see packages/domain's workspace-role helpers for the
// hierarchy comparison used by WorkspaceAuthorizer.requireRole (§5.4).
export const WORKSPACE_ROLES = ['VIEWER', 'EDITOR', 'OWNER'] as const;

export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export interface WorkspaceMembership {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
}

export interface WorkspaceRecord {
  workspaceId: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
