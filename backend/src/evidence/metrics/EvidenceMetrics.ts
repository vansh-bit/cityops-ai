export class EvidenceMetrics {
  
  private static metrics = {
    totalEvidenceCollected: 0,
    validationFailures: 0,
    providerFailures: 0,
    latencies: [] as number[]
  };

  static recordEvidenceCollected(): void {
    this.metrics.totalEvidenceCollected++;
  }

  static recordValidationFailure(): void {
    this.metrics.validationFailures++;
  }

  static recordProviderFailure(): void {
    this.metrics.providerFailures++;
  }

  static recordProviderLatency(latencyMs: number): void {
    this.metrics.latencies.push(latencyMs);
    // In a real production scenario, this might push to Prometheus/Datadog
    // Here we just keep an in-memory buffer for deterministic testing.
  }

  static getMetricsSnapshot() {
    const sum = this.metrics.latencies.reduce((a, b) => a + b, 0);
    const avgLatency = this.metrics.latencies.length > 0 ? sum / this.metrics.latencies.length : 0;
    
    return {
      totalCollected: this.metrics.totalEvidenceCollected,
      validationFailures: this.metrics.validationFailures,
      providerFailures: this.metrics.providerFailures,
      averageLatencyMs: avgLatency
    };
  }

  static reset(): void {
    this.metrics = {
      totalEvidenceCollected: 0,
      validationFailures: 0,
      providerFailures: 0,
      latencies: []
    };
  }
}
