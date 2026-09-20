import type { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

import { ProblemDetailsException } from '../common/problem-details.exception';
import { JwtAuthGuard, type AuthenticatedRequest } from './jwt-auth.guard';

jest.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: { create: jest.fn() },
}));

function contextWithHeader(authorization: string | undefined): ExecutionContext {
  const request: Partial<AuthenticatedRequest> = { headers: { authorization } };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let verify: jest.Mock;
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    verify = jest.fn();
    (CognitoJwtVerifier.create as jest.Mock).mockReturnValue({ verify });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) =>
              ({ COGNITO_USER_POOL_ID: 'us-east-1_example', COGNITO_CLIENT_ID: 'client-id' })[key],
          },
        },
      ],
    }).compile();

    guard = module.get(JwtAuthGuard);
  });

  it('rejects a request with no Authorization header', async () => {
    await expect(guard.canActivate(contextWithHeader(undefined))).rejects.toBeInstanceOf(
      ProblemDetailsException,
    );
    expect(verify).not.toHaveBeenCalled();
  });

  it('rejects a header that is not a Bearer token', async () => {
    await expect(guard.canActivate(contextWithHeader('Basic abc123'))).rejects.toBeInstanceOf(
      ProblemDetailsException,
    );
  });

  it('rejects a token that fails verification', async () => {
    verify.mockRejectedValue(new Error('signature invalid'));

    await expect(guard.canActivate(contextWithHeader('Bearer bad-token'))).rejects.toBeInstanceOf(
      ProblemDetailsException,
    );
  });

  it('attaches the authenticated user and allows the request through on a valid token', async () => {
    verify.mockResolvedValue({ sub: 'user-1' });
    const request: Partial<AuthenticatedRequest> = {
      headers: { authorization: 'Bearer good-token' },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'user-1' });
  });
});
