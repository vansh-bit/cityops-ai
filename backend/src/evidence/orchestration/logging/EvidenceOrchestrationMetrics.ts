export interface OrchestrationMetricsPayload {
  providerLatencyMap: Record<string, number>;
  orchestrationDuration: number;
  providerSuccessRate: number;
  providerFailureRate: number;
  evidenceCount: number;
  aggregationStatistics: {
    totalProvidersRequested: number;
    totalProvidersCompleted: number;
    totalProvidersFailed: number;
  };
}

export class EvidenceOrchestrationMetrics {
  private providerLatencies: Record<string, number> = {};
  private successCount = 0;
  private failureCount = 0;
  private evidenceCount = 0;
  private orchestrationStartTime = 0;

  startOrchestration() {
    this.orchestrationStartTime = Date.now();
  }

  recordProviderLatency(providerName: string, durationMs: number) {
    this.providerLatencies[providerName] = durationMs;
  }

  recordProviderSuccess(evidenceItemsReturned: number) {
    this.successCount++;
    this.evidenceCount += evidenceItemsReturned;
  }

  recordProviderFailure() {
    this.failureCount++;
  }

  generateMetricsPayload(): OrchestrationMetricsPayload {
    const total = this.successCount + this.failureCount;
    const orchestrationDuration = Date.now() - this.orchestrationStartTime;
    
    return {
      providerLatencyMap: this.providerLatencies,
      orchestrationDuration,
      providerSuccessRate: total > 0 ? this.successCount / total : 0,
      providerFailureRate: total > 0 ? this.failureCount / total : 0,
      evidenceCount: this.evidenceCount,
      aggregationStatistics: {
        totalProvidersRequested: total,
        totalProvidersCompleted: this.successCount,
        totalProvidersFailed: this.failureCount
      }
    };
  }
}
