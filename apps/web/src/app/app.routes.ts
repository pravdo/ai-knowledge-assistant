import type { Routes } from '@angular/router';

import { AuthCallbackPage } from './core/auth/auth-callback-page';
import { authGuard } from './core/auth/auth.guard';
import { LoginPage } from './core/auth/login-page';
import { WorkspacesPage } from './features/workspaces/workspaces-page';
import { PlaceholderPage, type PlaceholderPageData } from './shared/components/placeholder-page';

function placeholder(title: string, description: string): { data: PlaceholderPageData } {
  return { data: { title, description } };
}

// Route table from docs/architecture.md §Angular application plan. The guard below improves UX
// by not rendering protected pages for an unauthenticated user; the API remains the authorization
// boundary regardless of what the client requests.
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'workspaces' },
  { path: 'login', component: LoginPage },
  { path: 'auth/callback', component: AuthCallbackPage },
  {
    path: 'workspaces',
    component: WorkspacesPage,
    canActivate: [authGuard],
  },
  {
    path: 'workspaces/:workspaceId',
    component: PlaceholderPage,
    canActivate: [authGuard],
    ...placeholder('Workspace overview', 'Status, document counts, active RAG configuration.'),
  },
  {
    path: 'workspaces/:workspaceId/documents',
    component: PlaceholderPage,
    canActivate: [authGuard],
    ...placeholder('Documents', 'Upload, processing status, reprocess, and delete.'),
  },
  {
    path: 'workspaces/:workspaceId/chat',
    component: PlaceholderPage,
    canActivate: [authGuard],
    ...placeholder('Chat', 'Grounded, streamed question answering with citations.'),
  },
  {
    path: 'workspaces/:workspaceId/conversations/:conversationId',
    component: PlaceholderPage,
    canActivate: [authGuard],
    ...placeholder('Conversation', 'A stored conversation, replayed from message history.'),
  },
  {
    path: 'workspaces/:workspaceId/evaluations',
    component: PlaceholderPage,
    canActivate: [authGuard],
    ...placeholder('Evaluations', 'RAG configuration comparisons and evaluation runs.'),
  },
  {
    path: 'workspaces/:workspaceId/settings',
    component: PlaceholderPage,
    canActivate: [authGuard],
    ...placeholder('Settings', 'Owner-only: members, active configuration, retention, deletion.'),
  },
  {
    path: 'admin/operations',
    component: PlaceholderPage,
    canActivate: [authGuard],
    ...placeholder('Operations', 'Alarms, DLQ redrive, and ingestion health (operator role).'),
  },
  {
    path: '**',
    component: PlaceholderPage,
    ...placeholder('Not found', 'Nothing lives at this address.'),
  },
];
