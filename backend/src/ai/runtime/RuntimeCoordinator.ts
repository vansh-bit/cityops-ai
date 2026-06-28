import { randomUUID } from 'crypto';
import { RuntimeStateManager } from './RuntimeStateManager';
import { ExecutionController } from './ExecutionController';
import { ResponseBuilder } from './ResponseBuilder';
import { FailureCoordinator } from './FailureCoordinator';
import { RuntimeLogger } from './RuntimeLogger';
import { RuntimeMetrics } from './RuntimeMetrics';
import { PerceptionResult, DecisionState } from '../reasoning/models/decisionModels';
import { ConfidenceEngine } from '../confidence/ConfidenceEngine';
import { FinalAIResponse, RuntimeStatus } from './models/runtimeModels';

export class RuntimeCoordinator {
  constructor(
    private readonly executionController: ExecutionController,
    private readonly confidenceEngine: ConfidenceEngine,
    private readonly responseBuilder: ResponseBuilder,
    private readonly failureCoordinator: FailureCoordinator,
    private readonly logger: RuntimeLogger,
    private readonly metrics: RuntimeMetrics
  ) {}

  /**
   * Main entry point for the AI Runtime execution.
   */
  public async execute(perception: PerceptionResult): Promise<FinalAIResponse> {
    const runtimeId = randomUUID();
    const correlationId = perception.metadata.imageRef || randomUUID();
    
    // Stage 1 - Runtime Initialization
    const stateManager = new RuntimeStateManager(runtimeId, correlationId);
    stateManager.setStatus(RuntimeStatus.RUNNING);
    this.logger.logInitialization(stateManager.getState());

    let decisionState: DecisionState | null = null;
    let confidenceMetadata = null;

    try {
      // Stages 2, 3, 4 - Coordinated Execution
      decisionState = await this.executionController.executeReasoningLoop(perception, stateManager);

      // Stage 5 - Confidence Evaluation
      if (decisionState && decisionState.stopped && decisionState.decisionResult) {
        const confidenceResult = this.confidenceEngine.evaluate(decisionState);
        confidenceMetadata = confidenceResult.metadata;
      }

      stateManager.setStatus(RuntimeStatus.COMPLETED);
      this.logger.logCompletion(stateManager.getState());
      this.metrics.recordExecution(stateManager.getState(), true);

    } catch (error) {
      this.logger.logFailure(stateManager.getState(), error as Error);
      try {
        this.failureCoordinator.handleFailure(error, stateManager);
      } catch (fatalError) {
        // Fatal error thrown by failure coordinator - caught so we can build failure response
      }
      this.metrics.recordExecution(stateManager.getState(), false);
    }

    // Stage 6 - Response Assembly
    return this.responseBuilder.buildResponse(
      stateManager.getState(),
      decisionState ? decisionState.decisionResult : null,
      confidenceMetadata
    );
  }
}
