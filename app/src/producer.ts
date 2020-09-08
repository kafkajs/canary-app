import { Kafka, Producer } from 'kafkajs';
import * as Sentry from '@sentry/node';
import { sleep } from './lib/sleep';
import { ILogger } from './lib/logger';

export interface KafkaProducerParameters {
  topic: string;
  interval: number;
  minMessages: number;
  maxMessages: number;
  errorChance: number;
}

const createMessage = (i: number) => {
  const template = [
    `short-message-${i}`,
    `Lorem ipsum ${i} dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud etemplateercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum`,
  ];
  return template[i % 2];
};

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

    const schedule = async () => {
      const { maxMessages: max, minMessages: min, interval } = this.options;
      while (this.running) {
        try {
          const numMessages = Math.floor(Math.random() * (max - min + 1)) + min;
          this.logger.debug('Producing messages', numMessages);
          const response = await Promise.all([this.produce(numMessages), sleep(interval)]);
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
    };

    schedule();
  }

  public async stop(): Promise<void> {
    this.logger.info('Stopping producer');
    this.running = false;
    await this.disconnect();
  }

  private async produce(numberOfMessages: number) {
    const messages = Array(numberOfMessages)
      .fill(null)
      .map((_, i) => ({
        value: JSON.stringify({ createAt: Date.now(), payload: createMessage(i) }),
      }));

    return this.producer.send({
      topic: this.options.topic,
      messages,
    });
  }
}
