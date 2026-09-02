import { Injectable, inject, signal } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';

import { authConfig } from './auth.config';

export interface CurrentUser {
  readonly id: string;
  readonly email: string;
}

interface IdTokenClaims {
  readonly sub?: string;
  readonly email?: string;
}

// Thin wrapper around angular-oauth2-oidc (§4.3: "do not manually implement OAuth token
// exchange" — use a well-understood library). Nothing else in the app talks to OAuthService
// directly.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly oauthService = inject(OAuthService);

  private readonly authenticated = signal(false);
  private readonly user = signal<CurrentUser | null>(null);

  readonly isAuthenticated = this.authenticated.asReadonly();
  readonly currentUser = this.user.asReadonly();

  /** Runs once at app bootstrap (see app.config.ts) before routing decisions are made. */
  async initialize(): Promise<void> {
    this.oauthService.configure(authConfig);
    this.oauthService.events.subscribe((event) => {
      if (event.type === 'token_received' || event.type === 'logout') {
        this.refreshState();
      }
    });
    await this.oauthService.loadDiscoveryDocumentAndTryLogin();
    this.refreshState();
  }

  login(): void {
    this.oauthService.initCodeFlow();
  }

  logout(): void {
    this.oauthService.logOut();
  }

  get accessToken(): string | null {
    return this.oauthService.getAccessToken() || null;
  }

  private refreshState(): void {
    const hasValidToken = this.oauthService.hasValidAccessToken();
    this.authenticated.set(hasValidToken);

    if (!hasValidToken) {
      this.user.set(null);
      return;
    }

    const claims = this.oauthService.getIdentityClaims() as IdTokenClaims | null;
    this.user.set(claims?.sub ? { id: claims.sub, email: claims.email ?? '' } : null);
  }
}
