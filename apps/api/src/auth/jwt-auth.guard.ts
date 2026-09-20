import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import type { Request } from 'express';

import { ProblemDetailsException } from '../common/problem-details.exception.js';

// Populated from the access token's `sub` claim once the guard has verified it. Email is
// deliberately absent: Cognito access tokens don't carry it, and nothing in the authorization
// model (workspace membership by userId) needs it.
export interface AuthenticatedUser {
  readonly id: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

function extractBearerToken(header: string | undefined): string | undefined {
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
}

// §5.4 step 1: "Read authenticated subject from the validated token context." Verifies the
// access token's signature, expiry, and audience against Cognito's JWKS on every request —
// identically whether running locally or behind API Gateway's own Cognito authorizer. This guard
// is the single source of truth for "who is the caller," so local dev and deployed behavior can
// never diverge, and it never trusts a request claiming to already be authenticated.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private verifier: ReturnType<typeof CognitoJwtVerifier.create> | undefined;

  constructor(private readonly config: ConfigService) {}

  // Built lazily, on first use rather than in the constructor: JwtAuthGuard is a singleton
  // provider Nest instantiates at bootstrap, and health/live must stay up even if Cognito
  // configuration is missing or broken — the app should start; only guarded routes should fail.
  private getVerifier(): ReturnType<typeof CognitoJwtVerifier.create> {
    this.verifier ??= CognitoJwtVerifier.create({
      userPoolId: this.config.getOrThrow<string>('COGNITO_USER_POOL_ID'),
      clientId: this.config.getOrThrow<string>('COGNITO_CLIENT_ID'),
      tokenUse: 'access',
    });
    return this.verifier;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new ProblemDetailsException(
        'AUTHENTICATION_REQUIRED',
        'A valid access token is required.',
      );
    }

    try {
      const payload = await this.getVerifier().verify(token);
      request.user = { id: payload.sub };
      return true;
    } catch {
      throw new ProblemDetailsException(
        'AUTHENTICATION_REQUIRED',
        'The access token is invalid or expired.',
      );
    }
  }
}
