import { TestBed } from '@angular/core/testing';
import { OAuthService } from 'angular-oauth2-oidc';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service';

interface FakeOAuthEvent {
  readonly type: string;
}

function createFakeOAuthService() {
  return {
    configure: vi.fn(),
    events: new Subject<FakeOAuthEvent>(),
    loadDiscoveryDocumentAndTryLogin: vi.fn().mockResolvedValue(true),
    hasValidAccessToken: vi.fn().mockReturnValue(false),
    getIdentityClaims: vi.fn().mockReturnValue(null),
    getAccessToken: vi.fn().mockReturnValue(''),
    initCodeFlow: vi.fn(),
    logOut: vi.fn(),
  };
}

function setup() {
  const fakeOAuth = createFakeOAuthService();
  TestBed.configureTestingModule({
    providers: [{ provide: OAuthService, useValue: fakeOAuth }],
  });
  return { service: TestBed.inject(AuthService), fakeOAuth };
}

describe('AuthService', () => {
  it('is authenticated after initialize() when the OAuth service has a valid token', async () => {
    const { service, fakeOAuth } = setup();
    fakeOAuth.hasValidAccessToken.mockReturnValue(true);
    fakeOAuth.getIdentityClaims.mockReturnValue({ sub: 'user-1', email: 'a@example.com' });

    await service.initialize();

    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()).toEqual({ id: 'user-1', email: 'a@example.com' });
  });

  it('stays unauthenticated when there is no valid token', async () => {
    const { service } = setup();

    await service.initialize();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('delegates login/logout to the underlying OAuth service', () => {
    const { service, fakeOAuth } = setup();

    service.login();
    service.logout();

    expect(fakeOAuth.initCodeFlow).toHaveBeenCalledOnce();
    expect(fakeOAuth.logOut).toHaveBeenCalledOnce();
  });

  it('refreshes state when the OAuth service emits a token_received event', async () => {
    const { service, fakeOAuth } = setup();
    await service.initialize();
    expect(service.isAuthenticated()).toBe(false);

    fakeOAuth.hasValidAccessToken.mockReturnValue(true);
    fakeOAuth.getIdentityClaims.mockReturnValue({ sub: 'user-2' });
    fakeOAuth.events.next({ type: 'token_received' });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()).toEqual({ id: 'user-2', email: '' });
  });
});
