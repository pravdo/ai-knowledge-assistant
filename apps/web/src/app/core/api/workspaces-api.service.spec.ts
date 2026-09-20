import type { WorkspaceRecord } from '@ai-knowledge-assistant/contracts';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import { WorkspacesApi } from './workspaces-api.service';

const baseUrl = `${environment.apiBaseUrl}/v1/workspaces`;

function setup() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  return {
    api: TestBed.inject(WorkspacesApi),
    httpMock: TestBed.inject(HttpTestingController),
  };
}

describe('WorkspacesApi', () => {
  it('list() GETs the workspaces collection', () => {
    const { api, httpMock } = setup();
    const workspaces: WorkspaceRecord[] = [];

    api.list().subscribe((result) => expect(result).toBe(workspaces));

    httpMock.expectOne({ method: 'GET', url: baseUrl }).flush(workspaces);
    httpMock.verify();
  });

  it('create() POSTs the name and description', () => {
    const { api, httpMock } = setup();
    const created: WorkspaceRecord = {
      workspaceId: 'ws-1',
      name: 'Docs',
      description: 'Engineering docs',
      createdBy: 'user-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    api.create({ name: 'Docs', description: 'Engineering docs' }).subscribe((result) => {
      expect(result).toEqual(created);
    });

    const request = httpMock.expectOne({ method: 'POST', url: baseUrl });
    expect(request.request.body).toEqual({ name: 'Docs', description: 'Engineering docs' });
    request.flush(created);
    httpMock.verify();
  });
});
