import type { AILogger } from '../logging/aiLogger';
import type { DecisionResult, DecisionState, Observation, PerceptionResult, StopReason, ToolRequest } from './models';
import type { IDecisionStateManager } from './DecisionStateManager';
import type { IInitialReasoning } from './InitialReasoning';
import type { IEvidencePlanner } from './EvidencePlanner';
import type { IObservationProcessor } from './ObservationProcessor';
import type { IStoppingController } from './StoppingController';
import type { IDecisionGenerator } from './DecisionGenerator';

/**
 * Result of a reasoning step.
 * Runtime coordinator will inspect this to determine what to do next.
 */
export interface ReasoningStepResult {
  state: DecisionState;
  toolRequest?: ToolRequest;
  decisionResult?: DecisionResult;
  isComplete: boolean;
}

export interface IDecisionEngine {
  /**
   * Starts a new reasoning lifecycle from perception.
   */
  startReasoning(perception: PerceptionResult): Promise<ReasoningStepResult>;
  
  /**
   * Continues the reasoning lifecycle with a new observation.
   */
  processObservationAndContinue(state: DecisionState, observation: Observation): Promise<ReasoningStepResult>;
}

export interface DecisionEngineDependencies {
  aiLogger: AILogger;
  stateManager: IDecisionStateManager;
  initialReasoning: IInitialReasoning;
  evidencePlanner: IEvidencePlanner;
  observationProcessor: IObservationProcessor;
  stoppingController: IStoppingController;
  decisionGenerator: IDecisionGenerator;
}

export class DecisionEngine implements IDecisionEngine {
  constructor(private readonly dependencies: DecisionEngineDependencies) {}

  async startReasoning(perception: PerceptionResult): Promise<ReasoningStepResult> {
    const initialState = this.dependencies.stateManager.createState(perception);
    
    this.dependencies.aiLogger.logExecutionStarted({
      traceId: initialState.executionId,
      details: ['Decision Engine execution started (Phase 2 - Initial Reasoning)'],
    });

    try {
      // Step 1: Initial Reasoning
      const reasoningContext = await this.dependencies.initialReasoning.analyze(perception, initialState.executionId);
      
      let state = this.dependencies.stateManager.updateReasoningContext(initialState, reasoningContext);
      
      state = this.dependencies.stateManager.addReasoningEntry(state, {
        stepType: 'initial_reasoning',
        description: 'Completed initial reasoning over perception.',
      });

      // Continue to the reasoning loop (evidence planning / stopping)
      return this.continueReasoningLoop(state);
    } catch (err: any) {
      this.dependencies.aiLogger.logExecutionFailed('Initial reasoning failed', {
        traceId: initialState.executionId,
        details: [err.message],
      });
      throw err;
    }
  }

  async processObservationAndContinue(state: DecisionState, observation: Observation): Promise<ReasoningStepResult> {
    try {
      // Step 1: Process the observation and update reasoning state
      let newState = await this.dependencies.observationProcessor.processObservation(state, observation);
      
      // Step 2: Increment iteration counter (INV-04)
      newState = this.dependencies.stateManager.incrementIteration(newState);

      // Continue to the reasoning loop
      return this.continueReasoningLoop(newState);
    } catch (err: any) {
      this.dependencies.aiLogger.logExecutionFailed('Observation processing failed', {
        traceId: state.executionId,
        details: [err.message],
      });
      throw err;
    }
  }

  /**
   * Core reasoning loop logic.
   * Evaluates stopping conditions, plans evidence if needed, and generates the final decision.
   */
  private async continueReasoningLoop(state: DecisionState): Promise<ReasoningStepResult> {
    let currentState = state;

    // Check if we should stop
    const stopCheck = this.dependencies.stoppingController.shouldStop(currentState);
    if (stopCheck.shouldStop) {
      return this.finalizeDecision(currentState, stopCheck.reason!);
    }

    // We shouldn't stop based on current context. Try to plan evidence.
    const toolRequest = await this.dependencies.evidencePlanner.planEvidence(currentState);

    if (toolRequest) {
      // We need evidence. Add the request to state and return to RuntimeCoordinator.
      currentState = this.dependencies.stateManager.addToolRequest(currentState, toolRequest);
      
      currentState = this.dependencies.stateManager.addReasoningEntry(currentState, {
        stepType: 'evidence_requested',
        description: `Requested tool ${toolRequest.toolId} for reason: ${toolRequest.reason}`,
        metadata: { toolId: toolRequest.toolId, requestId: toolRequest.requestId },
      });

      return {
        state: currentState,
        toolRequest,
        isComplete: false,
      };
    } else {
      // No tool request generated, meaning no useful tools remain (Condition 4).
      // We must stop and finalize.
      return this.finalizeDecision(currentState, 'NO_USEFUL_TOOLS' as StopReason);
    }
  }

  /**
   * Finalizes the decision and terminates the reasoning loop.
   */
  private async finalizeDecision(state: DecisionState, reason: StopReason): Promise<ReasoningStepResult> {
    let currentState = state;

    // Mark state as stopped
    currentState = this.dependencies.stateManager.markStopped(currentState, reason);
    currentState = this.dependencies.stateManager.addReasoningEntry(currentState, {
      stepType: 'stop_decision',
      description: `Reasoning stopped. Reason: ${reason}`,
      metadata: { stopReason: reason },
    });

    // Generate final decision
    const decisionResult = await this.dependencies.decisionGenerator.generateDecision(currentState);

    // Save decision to state
    currentState = this.dependencies.stateManager.setDecisionResult(currentState, decisionResult);
    currentState = this.dependencies.stateManager.addReasoningEntry(currentState, {
      stepType: 'decision_generated',
      description: 'Generated final operational recommendation.',
      metadata: { 
        issueClassification: decisionResult.issueClassification,
        priority: decisionResult.priorityRecommendation 
      },
    });

    this.dependencies.aiLogger.logExecutionCompleted({
      traceId: currentState.executionId,
      details: ['Decision Engine execution completed successfully.'],
    });

    return {
      state: currentState,
      decisionResult,
      isComplete: true,
    };
  }
}
