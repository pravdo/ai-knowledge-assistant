import type { WorkspaceRecord } from '@ai-knowledge-assistant/contracts';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface CreateWorkspaceRequest {
  readonly name: string;
  readonly description?: string;
}

@Injectable({ providedIn: 'root' })
export class WorkspacesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/v1/workspaces`;

  list(): Observable<WorkspaceRecord[]> {
    return this.http.get<WorkspaceRecord[]>(this.baseUrl);
  }

  create(request: CreateWorkspaceRequest): Observable<WorkspaceRecord> {
    return this.http.post<WorkspaceRecord>(this.baseUrl, request);
  }
}
