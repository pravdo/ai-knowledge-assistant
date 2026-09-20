import type { ApplicationConfig } from '@angular/core';
import { inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { JwksValidationHandler, provideOAuthClient } from 'angular-oauth2-oidc';

import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // angular-oauth2-oidc's access-token interceptor is registered via the legacy HTTP_INTERCEPTORS
    // DI token, which provideHttpClient() only wires up with withInterceptorsFromDi().
    provideHttpClient(withInterceptorsFromDi()),
    provideOAuthClient(
      {
        resourceServer: {
          allowedUrls: [environment.apiBaseUrl],
          sendAccessToken: true,
        },
      },
      // Verifies the ID token's signature against Cognito's JWKS; the library defaults to no
      // verification at all (NullValidationHandler) if this isn't passed explicitly.
      JwksValidationHandler,
    ),
    // Blocks initial rendering until the OIDC discovery document loads and any pending code
    // exchange completes, so route guards see the correct auth state on first paint.
    provideAppInitializer(() => inject(AuthService).initialize()),
  ],
};
