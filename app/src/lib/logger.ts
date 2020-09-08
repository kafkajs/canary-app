import winston from 'winston';
import { createLogger as createWinstonLogger, Logger, format } from 'winston';
import { logLevel as KafkaJSLogLevel, logCreator } from 'kafkajs';
import { consoleFormat } from 'winston-console-format';
import config from 'config';

interface LeveledLogMethod {
  (message: string, ...meta: unknown[]): ILogger;
  (message: unknown): ILogger;
  (infoObject: Record<string, unknown>): ILogger;
}

interface LogEntry {
  level: string;
  message: string;
  [optionName: string]: unknown;
}

interface LogMethod {
  (level: string, message: string, ...meta: unknown[]): ILogger;
  (entry: LogEntry): ILogger;
  (level: string, message: unknown): ILogger;
}

export interface ILogger {
  debug: LeveledLogMethod;
  info: LeveledLogMethod;
  warn: LeveledLogMethod;
  error: LeveledLogMethod;
  log: LogMethod;
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export function toKafkaJSLogLevel(level: LogLevel): KafkaJSLogLevel {
  switch (level) {
    case LogLevel.DEBUG:
      return KafkaJSLogLevel.DEBUG;
    case LogLevel.WARN:
      return KafkaJSLogLevel.WARN;
    case LogLevel.ERROR:
      return KafkaJSLogLevel.ERROR;
    case LogLevel.INFO:
    default:
      return KafkaJSLogLevel.INFO;
  }
}

const toWinstonLogLevel = (level: LogLevel) => {
  switch (level) {
    case LogLevel.ERROR:
      return 'error';
    case LogLevel.WARN:
      return 'warn';
    case LogLevel.DEBUG:
      return 'debug';
    case LogLevel.INFO:
    default:
      return 'info';
  }
};

const toWinstonLogLevelFromKafkaJS = (level: KafkaJSLogLevel) => {
  switch (level) {
    case KafkaJSLogLevel.NOTHING:
    case KafkaJSLogLevel.ERROR:
      return 'error';
    case KafkaJSLogLevel.WARN:
      return 'warn';
    case KafkaJSLogLevel.INFO:
      return 'info';
    case KafkaJSLogLevel.DEBUG:
      return 'debug';
  }
};

export const createKafkaJSLogger = (logger: ILogger): logCreator => () => ({ level, log }) => {
  const { message, ...extra } = log;
  logger.log({
    level: toWinstonLogLevelFromKafkaJS(level),
    message,
    extra,
  });
};

export function createLogger(level: LogLevel): Logger {
  const transports = [
    config.get('logFormat') === 'pretty'
      ? new winston.transports.Console({
          format: format.combine(
            format.colorize({ all: true }),
            format.padLevels(),
            consoleFormat({
              showMeta: true,
              metaStrip: ['timestamp', 'service'],
              inspectOptions: {
                depth: Infinity,
                colors: true,
                maxArrayLength: Infinity,
                breakLength: 120,
                compact: Infinity,
              },
            }),
          ),
        })
      : new winston.transports.Console(),
  ];

  const logger = createWinstonLogger({
    level: toWinstonLogLevel(level),
    format: format.combine(
      format.timestamp(),
      format.ms(),
      format.errors({ stack: true }),
      format.splat(),
      format.json(),
    ),
    defaultMeta: {
      service: 'kafkajs-canary-app',
    },
    transports,
  });

  return logger;
}
