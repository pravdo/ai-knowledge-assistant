import { CfnOutput, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import type { Construct } from 'constructs';

import type { ApplicationStackProps } from './environment.js';

// Main resources (§13.1, §6.2): the main application DynamoDB table (workspace, membership,
// document, chunk, conversation, message, feedback, RAG configuration, evaluation — one table,
// access-pattern-driven keys per ADR-0004). Document S3, the idempotency table, KMS keys, and the
// S3 Vectors bucket land in later chunks as the features that need them are built.
export class DataStack extends Stack {
  readonly tableName: string;
  readonly tableArn: string;

  constructor(scope: Construct, id: string, props: ApplicationStackProps) {
    super(scope, id, props);

    const table = new Table(this, 'Table', {
      tableName: `${props.applicationName}-${props.environment}`,
      partitionKey: { name: 'pk', type: AttributeType.STRING },
      sortKey: { name: 'sk', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: props.environment === 'prod',
      },
      removalPolicy: props.environment === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    // User-to-workspace listing (§6.2). No other GSI is created until a real access pattern
    // needs it — every index adds write cost and operational surface (ADR-0004).
    table.addGlobalSecondaryIndex({
      indexName: 'gsi1',
      partitionKey: { name: 'gsi1pk', type: AttributeType.STRING },
      sortKey: { name: 'gsi1sk', type: AttributeType.STRING },
    });

    this.tableName = table.tableName;
    this.tableArn = table.tableArn;

    new CfnOutput(this, 'TableName', { value: table.tableName });
  }
}
