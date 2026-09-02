import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

import { AuthService } from './auth.service';

// Improves UX by not rendering protected pages for an unauthenticated user; it is not the
// authorization boundary — the API loads membership server-side and fails closed regardless of
// what the client requests (docs/architecture.md's trust boundaries).
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], { queryParams: { redirectTo: state.url } });
};
