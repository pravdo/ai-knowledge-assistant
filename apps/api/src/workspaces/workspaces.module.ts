import { Module } from '@nestjs/common';

import { MembershipsModule } from '../memberships/memberships.module.js';
import { WorkspacesController } from './workspaces.controller.js';
import { WorkspacesRepository } from './workspaces.repository.js';
import { WorkspacesService } from './workspaces.service.js';

@Module({
  imports: [MembershipsModule],
  providers: [WorkspacesRepository, WorkspacesService],
  controllers: [WorkspacesController],
})
export class WorkspacesModule {}
