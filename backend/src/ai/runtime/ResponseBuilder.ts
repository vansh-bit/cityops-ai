import { FinalAIResponse, RuntimeState } from './models/runtimeModels';
import { DecisionResult } from '../reasoning/models/decisionModels';
import { ConfidenceMetadata } from '../confidence/models/confidenceModels';

export class ResponseBuilder {
  /**
   * Assembles the final structured AI response conforming to Chapter 4 API contracts.
   */
  public buildResponse(
    runtimeState: RuntimeState,
    decisionResult: DecisionResult | null,
    confidenceMetadata: ConfidenceMetadata | null,
    evidence?: any[]
  ): FinalAIResponse {
    const startTime = new Date(runtimeState.startTime).getTime();
    const endTime = runtimeState.endTime 
      ? new Date(runtimeState.endTime).getTime() 
      : Date.now();
    const durationMs = endTime - startTime;

    return {
      correlationId: runtimeState.correlationId,
      runtimeId: runtimeState.runtimeId,
      status: runtimeState.status,
      decision: decisionResult,
      confidence: confidenceMetadata,
      evidence,
      runtimeMetadata: {
        durationMs,
        iterations: runtimeState.currentIteration,
        toolExecutions: runtimeState.toolExecutions
      },
      failureDetails: runtimeState.failureStatus 
        ? { message: runtimeState.failureStatus, isRecoverable: false }
        : undefined
    };
  }
}
