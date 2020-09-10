declare module 'cloudwatch-metrics' {
  export const enum MetricUnit {
    Seconds = 'Seconds',
    Microseconds = 'Microseconds',
    Milliseconds = 'Milliseconds',
    Bytes = 'Bytes',
    Kilobytes = 'Kilobytes',
    Megabytes = 'Megabytes',
    Gigabytes = 'Gigabytes',
    Terabytes = 'Terabytes',
    Bits = 'Bits',
    Kilobits = 'Kilobits',
    Megabits = 'Megabits',
    Gigabits = 'Gigabits',
    Terabits = 'Terabits',
    Percent = 'Percent',
    Count = 'Count',
    Bytes_Second = 'Bytes/Second',
    Kilobytes_Second = 'Kilobytes/Second',
    Megabytes_Second = 'Megabytes/Second',
    Gigabytes_Second = 'Gigabytes/Second',
    Terabytes_Second = 'Terabytes/Second',
    Bits_Second = 'Bits/Second',
    Kilobits_Second = 'Kilobits/Second',
    Megabits_Second = 'Megabits/Second',
    Gigabits_Second = 'Gigabits/Second',
    Terabits_Second = 'Terabits/Second',
    Count_Second = 'Count/Second',
    None = 'None',
  }

  export interface MetricOptions {
    enabled?: boolean;
    sendInterval?: number;
    summaryInterval?: number;
    sendCallback?: (error: Error) => void;
    maxCapacity?: number;
    withTimestamp?: boolean;
    storageResolution?: number;
  }

  export interface Dimensions {
    [key: string]: string;
  }

  export interface AwsConfig {
    region: string;
  }

  export class Metric {
    constructor(namespace: string, units: MetricUnit, defaultDimensions?: Dimensions, options?: MetricOptions);
    put(value: number, metricName: string, units?: MetricUnit, additionalDimensions?: Dimensions): void;
    summaryPut(value: number, metricName: string, units?: MetricUnit, additionalDimensions?: Dimensions): void;
    sample(
      value: number,
      metricName: string,
      units: MetricUnit,
      additionalDimensions: Dimensions,
      sampleRate: number,
    ): void;
    hasMetrics(): boolean;
    shutdown(): void;
  }

  export function initialize(config: AwsConfig): void;
}
