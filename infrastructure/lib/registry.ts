import * as cdk from '@aws-cdk/core';
import { Repository } from '@aws-cdk/aws-ecr';
import { RemovalPolicy } from '@aws-cdk/core';

export class KafkaJSCanaryAppContainerRegistry extends cdk.Construct {
  public readonly registry: Repository;

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    this.registry = new Repository(this, 'AppRepository', {
      repositoryName: 'kafkajs-canary-app',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.registry.addLifecycleRule({
      maxImageAge: cdk.Duration.days(120),
    });
  }
}
