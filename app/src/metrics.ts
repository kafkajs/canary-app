import { initialize, Dimension, MetricOptions, Metric, MetricUnit } from 'cloudwatch-metrics';

export interface MetricsConfig {
  region: string;
  namespace: string;
  defaultDimensions?: Dimension[];
  defaultMetricOptions?: Partial<MetricOptions>;
  enabled: boolean;
}

export class Metrics {
  private readonly enabled: boolean;
  private readonly defaultDimensions: Dimension[];
  private readonly namespacePrefix: string;
  private readonly defaultMetricOptions: Partial<MetricOptions>;

  constructor(config: MetricsConfig) {
    this.enabled = config.enabled;
    this.namespacePrefix = config.namespace;
    this.defaultDimensions = config.defaultDimensions ?? [];
    this.defaultMetricOptions = config.defaultMetricOptions ?? {};

    initialize({
      region: config.region,
    });
  }

  public createNamespace(
    namespace: string,
    units: MetricUnit,
    defaultDimensions?: Dimension[],
    options?: Partial<MetricOptions>,
  ): Metric {
    return new Metric(this.getNamespace(namespace), units, this.getDimensions(defaultDimensions), {
      enabled: this.enabled,
      ...this.getMetricOptions(options),
    });
  }

  private getNamespace(namespace: string) {
    return `${this.namespacePrefix}/${namespace}`;
  }

  private getDimensions(metricDimensions: Dimension[] = []) {
    const merged = this.defaultDimensions
      .concat(metricDimensions)
      .reduce<{ [key: string]: string }>((dimensions, { Name, Value }) => {
        dimensions[Name] = Value;
        return dimensions;
      }, {});

    return Object.entries(merged).map(([key, value]) => ({ Name: key, Value: value }));
  }

  private getMetricOptions(metricOptions: Partial<MetricOptions> = {}): Partial<MetricOptions> {
    return Object.assign({}, this.defaultMetricOptions, metricOptions);
  }
}
