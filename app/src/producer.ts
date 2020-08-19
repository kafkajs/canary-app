import { Kafka, Producer } from 'kafkajs';
import * as Sentry from '@sentry/node';
import { sleep } from './lib/sleep';
import { ILogger } from './lib/logger';

export interface KafkaProducerParameters {
  topic: string;
  interval: number;
  numberOfMessages: number;
}

export class KafkaProducer {
  private readonly producer: Producer;
  private readonly logger: ILogger;
  private readonly options: KafkaProducerParameters;
  private running: boolean;

  constructor(kafka: Kafka, logger: ILogger, options: KafkaProducerParameters) {
    this.producer = kafka.producer();
    this.logger = logger;
    this.options = options;
  }

  public async connect(): Promise<void> {
    await this.producer.connect();
  }

  public async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }

  public run(onError: (error: Error) => Promise<void>): void {
    this.running = true;

    (async () => {
      while (this.running) {
        try {
          const response = await Promise.all([this.produce(), sleep(this.options.interval)]);
          this.logger.debug('Produced messages', response);
        } catch (error) {
          try {
            await onError(error);
          } catch (errorHandlerError) {
            this.logger.error('Error in crash handler. Stopping producer', {
              error,
              errorHandlerError,
            });
            Sentry.captureException(errorHandlerError);
            await this.stop();
          }
        }
      }
    })();
  }

  public async stop(): Promise<void> {
    this.logger.info('Stopping producer');
    this.running = false;
    await this.disconnect();
  }

  private async produce() {
    const messages = [];

    const date = new Date().toISOString();

    for (let i = 0; i < this.options.numberOfMessages; i++) {
      messages.push({
        value: JSON.stringify({
          message: `message-${i}`,
          date,
        }),
      });
    }

    return this.producer.send({
      topic: this.options.topic,
      messages,
    });
  }
}
