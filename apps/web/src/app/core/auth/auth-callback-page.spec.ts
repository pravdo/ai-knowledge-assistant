import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { AuthCallbackPage } from './auth-callback-page';
import { AuthService } from './auth.service';

describe('AuthCallbackPage', () => {
  it('redirects to /workspaces when authenticated', () => {
    TestBed.configureTestingModule({
      imports: [AuthCallbackPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isAuthenticated: () => true } },
      ],
    });
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');

    TestBed.createComponent(AuthCallbackPage);

    expect(navigateSpy).toHaveBeenCalledWith('/workspaces');
  });

  it('shows a retry link when sign-in did not complete', async () => {
    TestBed.configureTestingModule({
      imports: [AuthCallbackPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isAuthenticated: () => false } },
      ],
    });

    const fixture = TestBed.createComponent(AuthCallbackPage);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Try again');
  });
});
