import type { ProblemDetails, WorkspaceRecord } from '@ai-knowledge-assistant/contracts';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { WorkspacesApi } from '../../core/api/workspaces-api.service';

@Component({
  selector: 'aka-workspaces-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './workspaces-page.html',
})
export class WorkspacesPage {
  private readonly api = inject(WorkspacesApi);

  readonly workspaces = signal<WorkspaceRecord[]>([]);
  readonly loading = signal(true);
  readonly creating = signal(false);
  readonly errorMessage = signal<string | null>(null);
  name = '';
  description = '';

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (workspaces) => {
        this.workspaces.set(workspaces);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(this.describeError(error));
        this.loading.set(false);
      },
    });
  }

  submitCreate(): void {
    const name = this.name.trim();
    if (!name) {
      return;
    }

    this.creating.set(true);
    this.errorMessage.set(null);
    this.api.create({ name, description: this.description.trim() || undefined }).subscribe({
      next: (workspace) => {
        this.workspaces.update((current) => [...current, workspace]);
        this.name = '';
        this.description = '';
        this.creating.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(this.describeError(error));
        this.creating.set(false);
      },
    });
  }

  private describeError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.error) {
      const body = error.error as Partial<ProblemDetails>;
      if (body.detail) {
        return body.detail;
      }
    }
    return 'Something went wrong. Try again.';
  }
}
