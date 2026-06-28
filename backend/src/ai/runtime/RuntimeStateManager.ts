import { RuntimeState, RuntimeStatus } from './models/runtimeModels';

export class RuntimeStateManager {
  private state: RuntimeState;

  constructor(runtimeId: string, correlationId: string) {
    this.state = {
      runtimeId,
      correlationId,
      status: RuntimeStatus.INITIALIZED,
      currentIteration: 0,
      toolExecutions: 0,
      startTime: new Date().toISOString(),
      endTime: null,
      failureStatus: null
    };
  }

  public getState(): RuntimeState {
    return { ...this.state };
  }

  public setStatus(status: RuntimeStatus): void {
    this.state.status = status;
    if (status === RuntimeStatus.COMPLETED || status === RuntimeStatus.FAILED) {
      this.state.endTime = new Date().toISOString();
    }
  }

  public incrementIteration(): void {
    this.state.currentIteration++;
  }

  public incrementToolExecutions(): void {
    this.state.toolExecutions++;
  }

  public setFailure(reason: string): void {
    this.state.failureStatus = reason;
    this.setStatus(RuntimeStatus.FAILED);
  }
}
