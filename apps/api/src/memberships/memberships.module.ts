import { Module } from '@nestjs/common';

// Every workspace use case authorizes through this module first. Never authorize on the
// presence of a workspace/document/conversation ID alone — see docs/threat-model.md.
@Module({})
export class MembershipsModule {}
