import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HealthModule } from './health/health.module';
import { MembershipsModule } from './memberships/memberships.module';
import { WorkspacesModule } from './workspaces/workspaces.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WorkspacesModule,
    MembershipsModule,
    HealthModule,
  ],
})
export class AppModule {}
