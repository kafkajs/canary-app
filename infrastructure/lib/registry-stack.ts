import * as cdk from '@aws-cdk/core';
import { KafkaJSCanaryAppContainerRegistry } from './registry';
import { Repository } from '@aws-cdk/aws-ecr';

export class KafkaJSRegistryStack extends cdk.Stack {
  public readonly registry: Repository;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Just to work around a weird issue with dependent stacks.
    // TODO: Figure out how to remove this.
    new cdk.CfnParameter(this, 'version', {
      type: 'String',
      description: 'The label of the Docker image to deploy',
    });

    const { registry } = new KafkaJSCanaryAppContainerRegistry(this, 'ContainerRegistry');
    this.registry = registry;
  }
}
