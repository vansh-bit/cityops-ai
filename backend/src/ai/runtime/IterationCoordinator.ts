import { RuntimeStateManager } from './RuntimeStateManager';
import { RuntimeExecutionError } from './models/runtimeModels';
import { RuntimeLogger } from './RuntimeLogger';

export interface IterationConfig {
  maxIterations: number;
}

export class IterationCoordinator {
  constructor(
    private readonly config: IterationConfig,
    private readonly logger: RuntimeLogger
  ) {}

  /**
   * Prepares the state for the next reasoning iteration.
   * Throws a fatal orchestration error if the max iterations limit is breached.
   */
  public prepareNextIteration(stateManager: RuntimeStateManager): void {
    const currentState = stateManager.getState();
    
    if (currentState.currentIteration >= this.config.maxIterations) {
      throw new RuntimeExecutionError(
        `Orchestration aborted: Maximum iterations (${this.config.maxIterations}) exceeded.`,
        false
      );
    }

    stateManager.incrementIteration();
    this.logger.logIterationStart(currentState.currentIteration + 1, currentState.correlationId);
  }
}
