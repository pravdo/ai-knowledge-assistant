import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from './auth.service';

// By the time this route activates, app initialization (see app.config.ts) has already awaited
// the full code exchange — isAuthenticated() below reflects its outcome synchronously, no
// loading state to coordinate here.
@Component({
  selector: 'aka-auth-callback-page',
  imports: [RouterLink],
  template: `
    @if (authService.isAuthenticated()) {
      <p>Signed in. Redirecting…</p>
    } @else {
      <p>Sign-in did not complete. <a routerLink="/login">Try again</a>.</p>
    }
  `,
})
export class AuthCallbackPage {
  protected readonly authService = inject(AuthService);

  constructor() {
    if (this.authService.isAuthenticated()) {
      void inject(Router).navigateByUrl('/workspaces');
    }
  }
}
