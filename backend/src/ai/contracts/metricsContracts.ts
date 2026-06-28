interface AIExecutionMetric {
  metric: 'execution' | 'failure' | 'token-usage';
  traceId: string;
  durationMs?: number;
  promptId?: string;
  model?: string;
  totalTokenCount?: number;
  timestamp: string;
}

interface AIMetricsSnapshot {
  totalExecutions: number;
  totalFailures: number;
  averageLatencyMs: number;
  metrics: AIExecutionMetric[];
}

export { type AIExecutionMetric, type AIMetricsSnapshot };
