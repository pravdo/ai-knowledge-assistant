import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import type { Request } from 'express';

import { ProblemDetailsException } from '../common/problem-details.exception.js';

export interface AuthenticatedUser {
  readonly id: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

function extractBearerToken(header: string | undefined): string | undefined {
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
}

// Verifies the access token's signature, expiry, and audience against Cognito's JWKS on every request
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private verifier: ReturnType<typeof CognitoJwtVerifier.create> | undefined;

  constructor(private readonly config: ConfigService) {}

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
