import type { AIExecutionMetric, AIMetricsSnapshot } from '../contracts';

interface AIMetricsCollector {
  recordExecution(metric: Omit<AIExecutionMetric, 'metric' | 'timestamp'>): void;
  recordFailure(metric: Omit<AIExecutionMetric, 'metric' | 'timestamp'>): void;
  recordTokenUsage(metric: Omit<AIExecutionMetric, 'metric' | 'timestamp'>): void;
  getSnapshot(): AIMetricsSnapshot;
}

let currentMetricsCollector: AIMetricsCollector;

class InMemoryAIMetricsCollector implements AIMetricsCollector {
  private readonly metrics: AIExecutionMetric[] = [];

  recordExecution(metric: Omit<AIExecutionMetric, 'metric' | 'timestamp'>): void {
    this.metrics.push({
      ...metric,
      metric: 'execution',
      timestamp: new Date().toISOString(),
    });
  }

  recordFailure(metric: Omit<AIExecutionMetric, 'metric' | 'timestamp'>): void {
    this.metrics.push({
      ...metric,
      metric: 'failure',
      timestamp: new Date().toISOString(),
    });
  }

  recordTokenUsage(metric: Omit<AIExecutionMetric, 'metric' | 'timestamp'>): void {
    this.metrics.push({
      ...metric,
      metric: 'token-usage',
      timestamp: new Date().toISOString(),
    });
  }

  getSnapshot(): AIMetricsSnapshot {
    const executionMetrics = this.metrics.filter((metric) => metric.metric === 'execution');
    const totalDuration = executionMetrics.reduce((sum, metric) => sum + (metric.durationMs || 0), 0);

    return {
      totalExecutions: executionMetrics.length,
      totalFailures: this.metrics.filter((metric) => metric.metric === 'failure').length,
      averageLatencyMs: executionMetrics.length === 0 ? 0 : totalDuration / executionMetrics.length,
      metrics: [...this.metrics],
    };
  }
}

function initializeAIMetricsCollector(metricsCollector: AIMetricsCollector): void {
  currentMetricsCollector = metricsCollector;
}

function getAIMetricsCollector(): AIMetricsCollector {
  if (!currentMetricsCollector) {
    currentMetricsCollector = new InMemoryAIMetricsCollector();
  }

  return currentMetricsCollector;
}

export {
  getAIMetricsCollector,
  initializeAIMetricsCollector,
  InMemoryAIMetricsCollector,
  type AIMetricsCollector,
};
