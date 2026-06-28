import { RuntimeExecutionError } from './models/runtimeModels';
import { RuntimeStateManager } from './RuntimeStateManager';

export class FailureCoordinator {
  /**
   * Evaluates an error during execution and decides whether to continue or abort.
   * Modifies the runtime state if the error is fatal.
   */
  public handleFailure(error: unknown, stateManager: RuntimeStateManager): void {
    if (error instanceof RuntimeExecutionError) {
      if (error.isRecoverable) {
        // Log recoverable error but do not fail the overall runtime.
        // The Decision Engine can see failed tool observations and adapt.
        return;
      }
      stateManager.setFailure(error.message);
      throw error;
    }

    // Unhandled errors are treated as fatal orchestration failures
    const errorMessage = error instanceof Error ? error.message : 'Unknown fatal runtime error';
    stateManager.setFailure(errorMessage);
    throw new RuntimeExecutionError(errorMessage, false);
  }
}
