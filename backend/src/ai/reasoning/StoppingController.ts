import type { AILogger } from '../logging/aiLogger';
import { type DecisionState, StopReason } from './models';

export interface IStoppingController {
  shouldStop(state: DecisionState): { shouldStop: boolean; reason?: StopReason };
}

export interface StoppingControllerDependencies {
  aiLogger: AILogger;
  maxIterations?: number; // Configurable max, default 3 as per Ch 5 §5.28 max tool invocations
}

export class StoppingController implements IStoppingController {
  private readonly maxIterations: number;

  constructor(private readonly dependencies: StoppingControllerDependencies) {
    this.maxIterations = dependencies.maxIterations ?? 3;
  }

  shouldStop(state: DecisionState): { shouldStop: boolean; reason?: StopReason } {
    // Condition 1 & 2: Sufficient evidence / No unresolved uncertainty remains
    if (state.reasoningContext && state.reasoningContext.uncertainties.length === 0) {
      this.dependencies.aiLogger.logExecutionCompleted({
        traceId: state.executionId,
        details: ['Stopping condition met: Sufficient evidence (no uncertainties remain).'],
      });
      return { shouldStop: true, reason: StopReason.SUFFICIENT_EVIDENCE };
    }

    // Condition 3: Maximum tool invocation limit reached (iteration limit)
    // We check toolRequests length as well as iteration count to prevent infinite loops
    if (state.iterationCount >= this.maxIterations || state.toolRequests.length >= this.maxIterations) {
      this.dependencies.aiLogger.logExecutionCompleted({
        traceId: state.executionId,
        details: [`Stopping condition met: Maximum iterations (${this.maxIterations}) reached.`],
      });
      return { shouldStop: true, reason: StopReason.MAX_ITERATIONS };
    }

    // Condition 4 / 5 (No useful tools remain / Immaterial improvement)
    // These conditions are also checked by the DecisionEngine orchestrator if EvidencePlanner returns null.
    // Here we can check if the last tool request failed and we have no other options, but for now
    // we rely on the EvidencePlanner returning null to signal NO_USEFUL_TOOLS.

    return { shouldStop: false };
  }
}
