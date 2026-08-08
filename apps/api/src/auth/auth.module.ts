import { Module } from '@nestjs/common';

// Validates the caller's identity from the token issued by Cognito (issuer, audience,
// expiration). Never decides workspace access — see MembershipsModule.
@Module({})
export class AuthModule {}
