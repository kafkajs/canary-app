import { initialize, Dimensions, MetricOptions, Metric, MetricUnit } from 'cloudwatch-metrics';

export interface MetricsConfig {
  region: string;
  namespace: string;
  defaultDimensions?: Dimensions;
  defaultMetricOptions?: Partial<MetricOptions>;
  enabled: boolean;
}

export class Metrics {
  private readonly enabled: boolean;
  private readonly defaultDimensions: Dimensions;
  private readonly namespacePrefix: string;

  constructor(config: MetricsConfig) {
    this.enabled = config.enabled;
    this.namespacePrefix = config.namespace;
    this.defaultDimensions = config.defaultDimensions ?? {};

    initialize({
      region: config.region,
    });
  }

  public createNamespace(
    namespace: string,
    units: MetricUnit,
    defaultDimensions?: Dimensions,
    options?: Partial<MetricOptions>,
  ): Metric {
    return new Metric(this.getNamespace(namespace), units, this.getDimensions(defaultDimensions), {
      enabled: this.enabled,
      ...options,
    });
  }

  private getNamespace(namespace: string) {
    return `${this.namespacePrefix}/${namespace}`;
  }

  private getDimensions(metricDimensions: Dimensions = {}) {
    return Object.assign({}, this.defaultDimensions, metricDimensions);
  }
}
