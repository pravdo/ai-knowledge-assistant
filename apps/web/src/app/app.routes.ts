import type { Routes } from '@angular/router';

import { PlaceholderPage, type PlaceholderPageData } from './shared/components/placeholder-page';

function placeholder(title: string, description: string): { data: PlaceholderPageData } {
  return { data: { title, description } };
}

// Route table from docs/architecture.md §Angular application plan. The frontend route guard
// (added in Week 2, once Cognito exists) improves UX; the API remains the authorization boundary
// regardless of what the client requests here.
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'workspaces' },
  {
    path: 'login',
    component: PlaceholderPage,
    ...placeholder('Sign in', 'Cognito hosted sign-in (Authorization Code with PKCE).'),
  },
  {
    path: 'auth/callback',
    component: PlaceholderPage,
    ...placeholder('Signing in…', 'OIDC callback: exchanges the authorization code for tokens.'),
  },
  {
    path: 'workspaces',
    component: PlaceholderPage,
    ...placeholder('Workspaces', 'Workspaces you can access, and create-workspace action.'),
  },
  {
    path: 'workspaces/:workspaceId',
    component: PlaceholderPage,
    ...placeholder('Workspace overview', 'Status, document counts, active RAG configuration.'),
  },
  {
    path: 'workspaces/:workspaceId/documents',
    component: PlaceholderPage,
    ...placeholder('Documents', 'Upload, processing status, reprocess, and delete.'),
  },
  {
    path: 'workspaces/:workspaceId/chat',
    component: PlaceholderPage,
    ...placeholder('Chat', 'Grounded, streamed question answering with citations.'),
  },
  {
    path: 'workspaces/:workspaceId/conversations/:conversationId',
    component: PlaceholderPage,
    ...placeholder('Conversation', 'A stored conversation, replayed from message history.'),
  },
  {
    path: 'workspaces/:workspaceId/evaluations',
    component: PlaceholderPage,
    ...placeholder('Evaluations', 'RAG configuration comparisons and evaluation runs.'),
  },
  {
    path: 'workspaces/:workspaceId/settings',
    component: PlaceholderPage,
    ...placeholder('Settings', 'Owner-only: members, active configuration, retention, deletion.'),
  },
  {
    path: 'admin/operations',
    component: PlaceholderPage,
    ...placeholder('Operations', 'Alarms, DLQ redrive, and ingestion health (operator role).'),
  },
  {
    path: '**',
    component: PlaceholderPage,
    ...placeholder('Not found', 'Nothing lives at this address.'),
  },
];
