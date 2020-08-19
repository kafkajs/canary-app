import express, { Express } from 'express';
import * as Sentry from '@sentry/node';
import { Kafka, KafkaConfig } from 'kafkajs';
import { KafkaProducer, KafkaProducerParameters } from './producer';
import config from 'config';
import { LogLevel, toKafkaJSLogLevel, createKafkaJSLogger, ILogger } from './lib/logger';
import { createLogger } from './lib/logger';
import { KafkaConsumerProps, KafkaConsumer } from './consumer';

export interface AppResources {
  app: Express;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  logger: ILogger;
}

export const createApp = (): AppResources => {
  const app = express();
  const logLevel = LogLevel[config.get('logLevel') as keyof typeof LogLevel];
  const logger = createLogger(logLevel);

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
  const consumer = new KafkaConsumer(kafka, logger, consumerConfig);

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

  return { app, start, stop, logger };
};
