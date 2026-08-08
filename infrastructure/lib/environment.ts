import type { StackProps } from 'aws-cdk-lib';

// At minimum dev and prod; stage is added once the pipeline is stable (§2.5). Each environment
// gets its own Cognito resources, S3 buckets, DynamoDB tables, queues, vector indexes, API stage,
// model/prompt configuration, KMS keys, and log groups/alarms/budgets — never shared.
export type DeploymentEnvironment = 'dev' | 'stage' | 'prod';

export interface ApplicationStackProps extends StackProps {
  readonly applicationName: string;
  readonly environment: DeploymentEnvironment;
}
