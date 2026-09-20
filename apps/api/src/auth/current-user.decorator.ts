import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { AuthenticatedRequest } from './jwt-auth.guard.js';

// Fails loudly (rather than silently returning undefined) if a route uses this without applying
// JwtAuthGuard first — a missing guard is a programming error, not a runtime auth failure, and
// should never be mistaken for one.
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!request.user) {
    throw new Error('@CurrentUser() used on a route without JwtAuthGuard applied.');
  }
  return request.user;
});
