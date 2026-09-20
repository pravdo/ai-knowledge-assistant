import type { WorkspaceRecord } from '@ai-knowledge-assistant/contracts';
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard, type AuthenticatedUser } from '../auth/jwt-auth.guard.js';
import { CreateWorkspaceDto } from './dto/create-workspace.dto.js';
import { WorkspacesService } from './workspaces.service.js';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}

  @Post()
  create(
    @Body() dto: CreateWorkspaceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WorkspaceRecord> {
    return this.workspaces.create({
      name: dto.name,
      description: dto.description ?? '',
      createdBy: user.id,
    });
  }

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser): Promise<WorkspaceRecord[]> {
    return this.workspaces.listForUser(user.id);
  }

  @Get(':workspaceId')
  getOne(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WorkspaceRecord> {
    return this.workspaces.getById(workspaceId, user.id);
  }
}
