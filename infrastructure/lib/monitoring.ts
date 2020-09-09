import * as cdk from '@aws-cdk/core';
import * as sns from '@aws-cdk/aws-sns';
import * as cloudwatch from '@aws-cdk/aws-cloudwatch';
import { BaseService } from '@aws-cdk/aws-ecs';
import { Duration } from '@aws-cdk/core';
import { SnsAction } from '@aws-cdk/aws-cloudwatch-actions';
import { HorizontalAnnotation, Color } from '@aws-cdk/aws-cloudwatch';

export interface MonitoringProps {
  service: BaseService;
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

    alarms.forEach((alarm: cloudwatch.Alarm) => alarm.addAlarmAction(new SnsAction(this.alertTopic)));

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
