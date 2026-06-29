import { AILogger } from '../logging/aiLogger';
import { RuntimeState } from './models/runtimeModels';

export class RuntimeLogger {
  constructor(private readonly logger: AILogger) {}

  public logInitialization(state: RuntimeState): void {
    this.logger.logExecutionStarted({
      traceId: state.correlationId,
      details: [`Runtime Orchestration initialized for Runtime ID: ${state.runtimeId}`]
    });
  }

  public logIterationStart(iteration: number, correlationId: string): void {
    this.logger.logExecutionStarted({
      traceId: correlationId,
      details: [`Starting runtime iteration: ${iteration}`]
    });
  }

  public logCompletion(state: RuntimeState): void {
    this.logger.logExecutionCompleted({
      traceId: state.correlationId,
      details: [
        `Runtime Orchestration completed successfully.`,
        `Total iterations: ${state.currentIteration}`,
        `Total tool executions: ${state.toolExecutions}`
      ]
    });
  }

  public logFailure(state: RuntimeState, error: Error): void {
    this.logger.logExecutionFailed(error.message, {
      traceId: state.correlationId,
      details: [
        `Runtime Orchestration failed: ${error.message}`,
        error.stack || ''
      ]
    });
  }
}
