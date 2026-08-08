import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { ConversationsModule } from './conversations/conversations.module';
import { DocumentsModule } from './documents/documents.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { FeedbackModule } from './feedback/feedback.module';
import { HealthModule } from './health/health.module';
import { MembershipsModule } from './memberships/memberships.module';
import { MessagesModule } from './messages/messages.module';
import { ObservabilityModule } from './observability/observability.module';
import { OperationsModule } from './operations/operations.module';
import { RagConfigurationModule } from './rag-configuration/rag-configuration.module';
import { UploadsModule } from './uploads/uploads.module';
import { UsersModule } from './users/users.module';
import { WorkspacesModule } from './workspaces/workspaces.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ObservabilityModule,
    AuthModule,
    UsersModule,
    WorkspacesModule,
    MembershipsModule,
    DocumentsModule,
    UploadsModule,
    ConversationsModule,
    MessagesModule,
    FeedbackModule,
    EvaluationsModule,
    RagConfigurationModule,
    OperationsModule,
    HealthModule,
  ],
})
export class AppModule {}
