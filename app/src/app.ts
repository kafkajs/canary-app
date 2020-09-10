import * as Sentry from '@sentry/node';
import { Kafka, KafkaConfig } from 'kafkajs';
import { KafkaProducer, KafkaProducerParameters } from './producer';
import config from 'config';
import { LogLevel, toKafkaJSLogLevel, createKafkaJSLogger, ILogger } from './lib/logger';
import { createLogger } from './lib/logger';
import { KafkaConsumerProps, KafkaConsumer } from './consumer';
import { Metrics, MetricsConfig } from './metrics';

export interface AppResources {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  logger: ILogger;
}

export const createApp = (): AppResources => {
  const logLevel = LogLevel[config.get('logLevel') as keyof typeof LogLevel];
  const logger = createLogger(logLevel);

  const metricOptions: MetricsConfig = config.get('metrics');
  const metrics = new Metrics({
    ...metricOptions,
    defaultMetricOptions: {
      ...metricOptions.defaultMetricOptions,
      sendCallback: (error) => {
        logger.error('Failed to send Cloudwatch Metrics', { error });
      },
    },
  });

  const kafkaConfig: KafkaConfig = {
    brokers: [config.get('kafka.host')],
    clientId: config.get('kafka.clientId'),
    ssl: config.get('kafka.ssl'),
    sasl: config.get('kafka.sasl'),
    logLevel: toKafkaJSLogLevel(logLevel),
    logCreator: createKafkaJSLogger(logger),
  };

  const kafka = new Kafka(kafkaConfig);

  const producerConfig: KafkaProducerParameters = config.get('producer');
  const producer = new KafkaProducer(kafka, logger, producerConfig);

  const consumerConfig: KafkaConsumerProps = config.get('consumer');
  const consumer = new KafkaConsumer(kafka, logger, metrics, consumerConfig);

  const start = async () => {
    await Promise.all([producer.connect(), consumer.connect()]);
    producer.run(async (error) => {
      logger.error('Producer encountered error', { error });
      Sentry.captureException(error);
    });
    await consumer.run();
  };

  const stop = async () => {
    await Promise.all([producer.stop(), consumer.stop()]);
  };

  return { start, stop, logger };
};
