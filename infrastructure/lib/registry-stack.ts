import * as cdk from '@aws-cdk/core';
import { KafkaJSCanaryAppContainerRegistry } from './registry';
import { Repository } from '@aws-cdk/aws-ecr';

export class KafkaJSRegistryStack extends cdk.Stack {
  public readonly registry: Repository;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const { registry } = new KafkaJSCanaryAppContainerRegistry(this, 'ContainerRegistry');
    this.registry = registry;
  }
}
