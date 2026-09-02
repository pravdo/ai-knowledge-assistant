import type { AuthConfig } from 'angular-oauth2-oidc';

import { environment } from '../../../environments/environment';

// §4.3: Authorization Code with PKCE, no client secret in the SPA. `issuer` is the User Pool's
// OIDC issuer (not the Hosted UI domain) — angular-oauth2-oidc discovers the actual
// authorize/token/logout endpoints (which live on the Hosted UI domain) from its
// .well-known/openid-configuration document.
export const authConfig: AuthConfig = {
  issuer: environment.cognito.issuer,
  clientId: environment.cognito.clientId,
  redirectUri: `${window.location.origin}/auth/callback`,
  postLogoutRedirectUri: `${window.location.origin}/`,
  responseType: 'code',
  scope: 'openid email profile',
  // Cognito's discovery document omits a few optional fields angular-oauth2-oidc's strict
  // validator expects (e.g. revocation_endpoint) — a known, documented mismatch, not a sign of a
  // misconfigured pool.
  strictDiscoveryDocumentValidation: false,
  showDebugInformation: !environment.production,
};
