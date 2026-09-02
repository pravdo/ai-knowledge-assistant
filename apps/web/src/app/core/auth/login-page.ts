import { Component, inject } from '@angular/core';

import { AuthService } from './auth.service';

@Component({
  selector: 'aka-login-page',
  template: `
    <section class="login-page">
      <h1>Sign in</h1>
      <p>Sign in to access your workspaces.</p>
      <button type="button" (click)="authService.login()">Sign in with Cognito</button>
    </section>
  `,
})
export class LoginPage {
  protected readonly authService = inject(AuthService);
}
