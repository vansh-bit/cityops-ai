import { AILogger } from '../../ai/logging/aiLogger';

export interface ExecutionMetrics {
  durationMs: number;
  startedAt: string;
  completedAt: string;
}

export class ExecutionMonitor {
  constructor(private readonly logger: AILogger) {}

  /**
   * Executes a promise with a timeout.
   * Logs execution metrics and handles timeouts gracefully.
   */
  public async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    context: { toolId: string; requestId: string }
  ): Promise<{ result: T; metrics: ExecutionMetrics }> {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    this.logger.logExecutionStarted({
      traceId: context.requestId,
      details: [`Tool execution started for ${context.toolId}`]
    });

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs);
      });

      const result = await Promise.race([operation(), timeoutPromise]);

      const durationMs = Date.now() - startTime;
      const completedAt = new Date().toISOString();

      this.logger.logExecutionCompleted({
        traceId: context.requestId,
        durationMs,
        details: [`Tool execution completed successfully for ${context.toolId}`]
      });

      return { result, metrics: { durationMs, startedAt, completedAt } };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const isTimeout = error instanceof Error && error.message === 'TIMEOUT';
      
      const errorMessage = isTimeout 
        ? `Execution timed out for tool ${context.toolId} after ${timeoutMs}ms` 
        : `Execution failed for tool ${context.toolId}: ${error instanceof Error ? error.message : 'Unknown error'}`;

      this.logger.logExecutionFailed(errorMessage, {
        traceId: context.requestId,
        details: [errorMessage]
      });

      throw error;
    }
  }
}
