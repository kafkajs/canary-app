import { Kafka, Consumer } from 'kafkajs';
import * as Sentry from '@sentry/node';
import { ILogger } from './lib/logger';
import { sleep } from './lib/sleep';
import { FailedOnPurpose } from './errors';
import { Metrics } from './metrics';
import { Metric, MetricUnit } from 'cloudwatch-metrics';

export interface KafkaConsumerProps {
  groupId: string;
  topic: string;
  minDuration: number;
  maxDuration: number;
  errorChance: number;
}

export class KafkaConsumer {
  private readonly consumer: Consumer;
  private readonly logger: ILogger;
  private readonly options: KafkaConsumerProps;
  private readonly metrics: Metrics;
  private metricNamespace: Metric;

  constructor(kafka: Kafka, logger: ILogger, metrics: Metrics, options: KafkaConsumerProps) {
    this.consumer = kafka.consumer({
      groupId: options.groupId,
    });

    this.logger = logger;
    this.options = options;
    this.metrics = metrics;
  }

  public async connect(): Promise<void> {
    await this.consumer.connect();
  }

  public async disconnect(): Promise<void> {
    await this.consumer.disconnect();
  }

  public async run(): Promise<void> {
    this.metricNamespace = this.setupMetrics();

    await this.consumer.subscribe({ topic: this.options.topic, fromBeginning: true });
    await this.consumer.run({
      partitionsConsumedConcurrently: 2,
      eachMessage: async ({ topic, partition, message }) => {
        const { maxDuration: max, minDuration: min, errorChance } = this.options;
        const sleepDuration = Math.floor(Math.random() * (max - min + 1)) + min;
        Sentry.addBreadcrumb({
          message: 'Consuming message',
          data: {
            topic,
            partition,
            offset: message.offset,
          },
        });

        await sleep(sleepDuration);
        if (Math.random() <= errorChance) {
          throw new FailedOnPurpose('Randomly induced error while consuming message');
        }

        try {
          this.logger.debug('Consumed message', {
            topic,
            partition,
            event: JSON.parse(message.value.toString()),
          });
        } catch (err) {
          Sentry.captureException(err);
          throw err;
        }
      },
    });
  }

  public async stop(): Promise<void> {
    await this.disconnect();
    this.metricNamespace.shutdown();
  }

  private setupMetrics(): Metric {
    const metricNamespace = this.metrics.createNamespace('Consumer', MetricUnit.Count);

    this.consumer.on(this.consumer.events.END_BATCH_PROCESS, ({ payload }) => {
      metricNamespace.put(payload.offsetLagLow, 'OffsetLag', {
        topic: payload.topic,
        partition: payload.partition,
      });
    });

    return metricNamespace;
  }
}
