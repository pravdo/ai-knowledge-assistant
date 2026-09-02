import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
  type UrlTree,
} from '@angular/router';
import { describe, expect, it } from 'vitest';

import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

function runGuard(isAuthenticated: boolean, url = '/workspaces/ws-1') {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: { isAuthenticated: () => isAuthenticated } },
    ],
  });

  return TestBed.runInInjectionContext(() =>
    authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
  );
}

describe('authGuard', () => {
  it('allows navigation when authenticated', () => {
    expect(runGuard(true)).toBe(true);
  });

  it('redirects to /login with the attempted URL when not authenticated', () => {
    const result = runGuard(false, '/workspaces/ws-1');

    expect(result).not.toBe(true);
    const tree = result as UrlTree;
    expect(tree.toString()).toContain('/login');
    expect(tree.queryParams['redirectTo']).toBe('/workspaces/ws-1');
  });
});
