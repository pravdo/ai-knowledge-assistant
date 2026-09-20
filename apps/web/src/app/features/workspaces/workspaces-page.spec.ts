import type { WorkspaceRecord } from '@ai-knowledge-assistant/contracts';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { WorkspacesApi } from '../../core/api/workspaces-api.service';
import { WorkspacesPage } from './workspaces-page';

const workspace: WorkspaceRecord = {
  workspaceId: 'ws-1',
  name: 'Docs',
  description: 'Engineering docs',
  createdBy: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function setup(api: Partial<WorkspacesApi>) {
  TestBed.configureTestingModule({
    imports: [WorkspacesPage],
    providers: [provideRouter([]), { provide: WorkspacesApi, useValue: api }],
  });
  const fixture = TestBed.createComponent(WorkspacesPage);
  fixture.detectChanges();
  return fixture;
}

describe('WorkspacesPage', () => {
  it('lists workspaces returned by the API on init', () => {
    const fixture = setup({ list: () => of([workspace]) });

    expect(fixture.componentInstance.workspaces()).toEqual([workspace]);
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('shows an error message when listing fails', () => {
    const problem = new HttpErrorResponse({ error: { detail: 'Session expired.' }, status: 401 });
    const fixture = setup({ list: () => throwError(() => problem) });

    expect(fixture.componentInstance.errorMessage()).toBe('Session expired.');
  });

  it('appends the created workspace and clears the form on successful create', () => {
    const create = vi.fn().mockReturnValue(of(workspace));
    const fixture = setup({ list: () => of([]), create });
    const component = fixture.componentInstance;
    component.name = 'Docs';
    component.description = 'Engineering docs';

    component.submitCreate();

    expect(create).toHaveBeenCalledWith({ name: 'Docs', description: 'Engineering docs' });
    expect(component.workspaces()).toEqual([workspace]);
    expect(component.name).toBe('');
    expect(component.description).toBe('');
  });

  it('does not submit when the name is blank', () => {
    const create = vi.fn();
    const fixture = setup({ list: () => of([]), create });
    fixture.componentInstance.name = '   ';

    fixture.componentInstance.submitCreate();

    expect(create).not.toHaveBeenCalled();
  });
});
