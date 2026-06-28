import { DecisionEngine, ReasoningStepResult } from '../reasoning/DecisionEngine';
import { ToolDispatcher } from '../../tools/registry/ToolDispatcher';
import { DecisionState, PerceptionResult } from '../reasoning/models/decisionModels';
import { IterationCoordinator } from './IterationCoordinator';
import { RuntimeStateManager } from './RuntimeStateManager';

export class ExecutionController {
  constructor(
    private readonly decisionEngine: DecisionEngine,
    private readonly toolDispatcher: ToolDispatcher,
    private readonly iterationCoordinator: IterationCoordinator
  ) {}

  /**
   * Executes the reasoning loop sequentially (Stages 2-4).
   * Returns the final decision state.
   */
  public async executeReasoningLoop(
    perception: PerceptionResult,
    stateManager: RuntimeStateManager
  ): Promise<DecisionState> {
    
    // Initial Reasoning
    let stepResult = await this.decisionEngine.startReasoning(perception);
    let decisionState = stepResult.state;

    while (!stepResult.isComplete) {
      this.iterationCoordinator.prepareNextIteration(stateManager);

      if (stepResult.toolRequest) {
        // Stage 3 - Tool Coordination
        const observation = await this.toolDispatcher.dispatch(stepResult.toolRequest);
        stateManager.incrementToolExecutions();
        
        // Stage 4 - Iterate reasoning with new observation
        stepResult = await this.decisionEngine.processObservationAndContinue(decisionState, observation);
        decisionState = stepResult.state;
      } else {
        // If there is no tool request and not complete, something is logically broken.
        // We break to avoid infinite loop. The decision engine should always return complete if it doesn't need a tool.
        break;
      }
    }

    return decisionState;
  }
}
