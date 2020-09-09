import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import * as sns from '@aws-cdk/aws-sns';
import * as cloudwatch from '@aws-cdk/aws-cloudwatch';
import { BaseService } from '@aws-cdk/aws-ecs';
import { Duration, BundlingDockerImage } from '@aws-cdk/core';
import { SnsAction } from '@aws-cdk/aws-cloudwatch-actions';
import { HorizontalAnnotation, Color } from '@aws-cdk/aws-cloudwatch';
import * as lambda from '@aws-cdk/aws-lambda';
import * as subscriptions from '@aws-cdk/aws-sns-subscriptions';
import { sync as commandExists } from 'command-exists';
import { execSync } from 'child_process';
import { IStringParameter } from '@aws-cdk/aws-ssm';

export interface MonitoringProps {
  service: BaseService;
  slackWebhookUrl: string;
}

export class KafkaJSMonitoring extends cdk.Construct {
  public readonly alertTopic: sns.Topic;
  private readonly service: BaseService;

  constructor(scope: cdk.Construct, id: string, props: MonitoringProps) {
    super(scope, id);

    this.service = props.service;
    this.alertTopic = new sns.Topic(this, 'Alerts', { topicName: 'kafkajs-canary-app-alerts' });

    this.createAlarms();
    this.createDashboard();

    this.createSlackNotifications(props.slackWebhookUrl);
  }

  private createAlarms(): cloudwatch.Alarm[] {
    const cpuUtilization = new cloudwatch.Alarm(this, 'ServiceCPUUtilization', {
      metric: this.service.metricCpuUtilization().with({ period: Duration.minutes(5) }),
      alarmDescription: 'Service average CPU utilization over 90% for 5 minutes',
      alarmName: 'High CPU Utilization',
      threshold: 90,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const memoryUtilization = new cloudwatch.Alarm(this, 'ServiceMemoryUtilization', {
      metric: this.service.metricMemoryUtilization().with({ period: Duration.minutes(5) }),
      alarmDescription: 'Service average memory utilization over 90% for 15 minutes',
      alarmName: 'High Memory Utilization',
      threshold: 90,
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const alarms = [cpuUtilization, memoryUtilization];

    alarms.forEach((alarm: cloudwatch.Alarm) => {
      alarm.addAlarmAction(new SnsAction(this.alertTopic));
      alarm.addOkAction(new SnsAction(this.alertTopic));
    });

    return alarms;
  }

  private createDashboard(): cloudwatch.Dashboard {
    const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: 'KafkaJS-Canary-App-Health',
      start: '-P24H', // last day 24H
    });

    dashboard.addWidgets(
      this.buildGraphWidget(
        'Service CPU Utilization',
        [this.service.metricCpuUtilization({ statistic: 'avg' }).with({ period: Duration.minutes(5) })],
        true,
        [{ label: 'Alarm threshold', color: Color.RED, value: 90 }],
      ),
    );

    dashboard.addWidgets(
      this.buildGraphWidget(
        'Service Memory Utilization',
        [this.service.metricMemoryUtilization({ statistic: 'avg' }).with({ period: Duration.minutes(5) })],
        true,
        [{ label: 'Alarm threshold', color: Color.RED, value: 90 }],
      ),
    );

    return dashboard;
  }

  private createSlackNotifications(slackWebhookUrl: string) {
    const srcDir = path.join(__dirname, '..', 'src');

    const handler = new lambda.Function(this, 'SlackNotifications', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(srcDir, {
        bundling: {
          image: BundlingDockerImage.fromRegistry('node:12-alpine'),
          command: ['sh', '-c', `NODE_ENV=production npm install && cp -r . /asset-output`],
          user: 'root', // https://github.com/aws/aws-cdk/issues/8707,
          local: {
            tryBundle: (outputDir: string): boolean => {
              if (commandExists('npm')) {
                try {
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  execSync(`npm ci && cp -r . ${outputDir}`, { cwd: srcDir });
                  return true;
                } catch (error) {
                  console.error(`Error during local bundling: ` + error);
                  return false;
                }
              }

              return false;
            },
          },
        },
      }),
      handler: 'cloudwatch-to-slack.handler',
      environment: {
        UNENCRYPTED_HOOK_URL: slackWebhookUrl,
      },
    });

    this.alertTopic.addSubscription(new subscriptions.LambdaSubscription(handler));
  }

  private buildGraphWidget(
    widgetName: string,
    metrics: cloudwatch.IMetric[],
    stacked = true,
    annotations?: HorizontalAnnotation[],
  ): cloudwatch.GraphWidget {
    return new cloudwatch.GraphWidget({
      title: widgetName,
      left: metrics,
      stacked: stacked,
      width: 8,
      leftAnnotations: annotations,
    });
  }
}
