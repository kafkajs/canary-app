import * as cdk from '@aws-cdk/core';
import {
  ICluster,
  ContainerImage,
  Secret,
  FargatePlatformVersion,
  FargateService,
  FargateTaskDefinition,
  LogDriver,
  AwsLogDriver,
  PropagatedTagSource,
} from '@aws-cdk/aws-ecs';
import { RetentionDays } from '@aws-cdk/aws-logs';

export interface KafkaJSCanaryAppFargateServiceProps {
  readonly serviceName?: string;
  readonly family?: string;
  readonly cluster: ICluster;
  readonly image: ContainerImage;
  readonly command?: string[];
  readonly desiredTaskCount?: number;
  readonly environment?: { [key: string]: string };
  readonly secrets?: { [key: string]: Secret };
  /**
   * The number of cpu units used by the task.
   *
   * Valid values, which determines your range of valid values for the memory parameter:
   *
   * 256 (.25 vCPU) - Available memory values: 0.5GB, 1GB, 2GB
   *
   * 512 (.5 vCPU) - Available memory values: 1GB, 2GB, 3GB, 4GB
   *
   * 1024 (1 vCPU) - Available memory values: 2GB, 3GB, 4GB, 5GB, 6GB, 7GB, 8GB
   *
   * 2048 (2 vCPU) - Available memory values: Between 4GB and 16GB in 1GB increments
   *
   * 4096 (4 vCPU) - Available memory values: Between 8GB and 30GB in 1GB increments
   *
   * This default is set in the underlying FargateTaskDefinition construct.
   *
   * @default 256
   */
  readonly cpu?: number;
  /**
   * The amount (in MiB) of memory used by the task.
   *
   * This field is required and you must use one of the following values, which determines your range of valid values
   * for the cpu parameter:
   *
   * 0.5GB, 1GB, 2GB - Available cpu values: 256 (.25 vCPU)
   *
   * 1GB, 2GB, 3GB, 4GB - Available cpu values: 512 (.5 vCPU)
   *
   * 2GB, 3GB, 4GB, 5GB, 6GB, 7GB, 8GB - Available cpu values: 1024 (1 vCPU)
   *
   * Between 4GB and 16GB in 1GB increments - Available cpu values: 2048 (2 vCPU)
   *
   * Between 8GB and 30GB in 1GB increments - Available cpu values: 4096 (4 vCPU)
   *
   * This default is set in the underlying FargateTaskDefinition construct.
   *
   * @default 512
   */
  readonly memoryLimitMiB?: number;
  readonly platformVersion?: FargatePlatformVersion;

  /**
   * The maximum number of tasks, specified as a percentage of the Amazon ECS
   * service's DesiredCount value, that can run in a service during a
   * deployment.
   *
   * @default 200
   */
  readonly maxHealthyPercent?: number;

  /**
   * The minimum number of tasks, specified as a percentage of
   * the Amazon ECS service's DesiredCount value, that must
   * continue to run and remain healthy during a deployment.
   *
   * @default 50
   */
  readonly minHealthyPercent?: number;

  /**
   * Specifies whether to propagate the tags from the task definition or the service to the tasks in the service.
   * Tags can only be propagated to the tasks within the service during service creation.
   *
   * @default - none
   */
  readonly propagateTags?: PropagatedTagSource;
  readonly enableECSManagedTags?: boolean;
}

export class KafkaJSCanaryAppFargateService extends cdk.Construct {
  public readonly environment: { [key: string]: string };
  public readonly secrets?: { [key: string]: Secret };
  public readonly service: FargateService;
  public readonly taskDefinition: FargateTaskDefinition;
  public readonly logDriver?: LogDriver;
  public readonly desiredCount: number;

  constructor(scope: cdk.Construct, id: string, props: KafkaJSCanaryAppFargateServiceProps) {
    super(scope, id);
    this.environment = props.environment || {};
    this.secrets = props.secrets;
    this.desiredCount = props.desiredTaskCount !== undefined ? props.desiredTaskCount : 1;

    this.logDriver = new AwsLogDriver({
      streamPrefix: this.node.id,
      logRetention: RetentionDays.ONE_MONTH,
    });

    this.taskDefinition = new FargateTaskDefinition(this, 'AppTaskDefinition', {
      memoryLimitMiB: props.memoryLimitMiB || 512,
      cpu: props.cpu || 256,
      family: props.family,
    });
    this.taskDefinition.addContainer('AppContainer', {
      image: props.image,
      command: props.command,
      environment: this.environment,
      secrets: this.secrets,
      logging: this.logDriver,
    });

    this.service = new FargateService(this, 'AppFargateService', {
      cluster: props.cluster,
      desiredCount: this.desiredCount,
      taskDefinition: this.taskDefinition,
      serviceName: props.serviceName,
      minHealthyPercent: props.minHealthyPercent,
      maxHealthyPercent: props.maxHealthyPercent,
      propagateTags: props.propagateTags,
      enableECSManagedTags: props.enableECSManagedTags,
      platformVersion: props.platformVersion,
    });
  }
}
