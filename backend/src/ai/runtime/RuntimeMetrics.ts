import { RuntimeState } from './models/runtimeModels';

export class RuntimeMetrics {
  private executionLatencies: number[] = [];
  private iterationCounts: number[] = [];
  private toolUsageCounts: number[] = [];
  private failureCount = 0;
  private successCount = 0;

  public recordExecution(state: RuntimeState, isSuccess: boolean): void {
    if (state.startTime && state.endTime) {
      const duration = new Date(state.endTime).getTime() - new Date(state.startTime).getTime();
      this.executionLatencies.push(duration);
    }
    
    this.iterationCounts.push(state.currentIteration);
    this.toolUsageCounts.push(state.toolExecutions);

    if (isSuccess) {
      this.successCount++;
    } else {
      this.failureCount++;
    }
  }

  public getStatistics() {
    return {
      averageLatencyMs: this.calculateAverage(this.executionLatencies),
      averageIterations: this.calculateAverage(this.iterationCounts),
      totalToolExecutions: this.calculateSum(this.toolUsageCounts),
      successRate: this.calculateSuccessRate(),
      totalFailures: this.failureCount
    };
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }

  private calculateSum(values: number[]): number {
    return values.reduce((a, b) => a + b, 0);
  }

  private calculateSuccessRate(): number {
    const total = this.successCount + this.failureCount;
    if (total === 0) return 0;
    return this.successCount / total;
  }
}
