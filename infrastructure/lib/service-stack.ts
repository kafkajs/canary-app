import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ssm from '@aws-cdk/aws-ssm';
import { KafkaJSCanaryAppFargateService } from './service';
import { Repository } from '@aws-cdk/aws-ecr';
import { Secret } from '@aws-cdk/aws-ecs';
import { CfnParameter } from '@aws-cdk/core';
import { KafkaJSMonitoring } from './monitoring';

export interface KafkaJSCanaryStackProps extends cdk.StackProps {
  registry: Repository;
  parameterStorePrefix: string;
}

export class KafkaJSCanaryStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: KafkaJSCanaryStackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'AppVPC', {
      maxAzs: 2,
    });

    const cluster = new ecs.Cluster(this, 'AppCluster', {
      vpc,
    });

    const secrets = {
      KAFKA_USERNAME: Secret.fromSsmParameter(
        ssm.StringParameter.fromSecureStringParameterAttributes(this, 'KafkaUsernameSecret', {
          parameterName: `${props.parameterStorePrefix}/kafka-username`,
          version: 1, // AWS CDK has no way to get the latest version. Hard-coded for now.
        }),
      ),
      KAFKA_PASSWORD: Secret.fromSsmParameter(
        ssm.StringParameter.fromSecureStringParameterAttributes(this, 'KafkaPasswordSecret', {
          parameterName: `${props.parameterStorePrefix}/kafka-password`,
          version: 1,
        }),
      ),
      SENTRY_DSN: Secret.fromSsmParameter(
        ssm.StringParameter.fromSecureStringParameterAttributes(this, 'SentryDSNSecret', {
          parameterName: `${props.parameterStorePrefix}/sentry-dsn`,
          version: 1,
        }),
      ),
    };

    const environment = {
      KAFKA_HOST: ssm.StringParameter.valueForStringParameter(this, `${props.parameterStorePrefix}/kafka-host`),
    };

    const imageTag = new CfnParameter(this, 'version', {
      type: 'String',
      description: 'The label of the Docker image to deploy',
    });

    const { service } = new KafkaJSCanaryAppFargateService(this, 'App', {
      cluster,
      desiredTaskCount: 2,
      image: ecs.ContainerImage.fromEcrRepository(props.registry, imageTag.valueAsString),
      environment,
      secrets,
    });

    const slackWebhookUrl = ssm.StringParameter.valueFromLookup(
      this,
      `${props.parameterStorePrefix}/alarm-slack-webhook`,
    );

    new KafkaJSMonitoring(this, 'Monitoring', {
      service,
      slackWebhookUrl,
    });
  }
}
