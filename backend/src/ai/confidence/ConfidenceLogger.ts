import { AILogger } from '../logging/aiLogger';
import { ConfidenceEvaluationResult } from './models/confidenceModels';

export class ConfidenceLogger {
  constructor(private readonly logger: AILogger) {}

  /**
   * Logs a successful confidence evaluation, recording telemetry and escalation metrics.
   */
  public logEvaluation(result: ConfidenceEvaluationResult, durationMs: number): void {
    this.logger.logExecutionCompleted({
      traceId: result.requestId,
      durationMs,
      details: [
        `Confidence Evaluation Complete for Decision ${result.decisionId}`,
        `Confidence Value: ${result.metadata.confidenceValue}`,
        `Confidence Level: ${result.metadata.confidenceLevel}`,
        `Escalation Required: ${result.metadata.escalationRequired}`,
        `Review Recommendation: ${result.metadata.reviewRecommendation}`
      ]
    });
  }

  /**
   * Logs an explicit failure in the evaluation process.
   */
  public logFailure(requestId: string, error: Error, durationMs: number): void {
    this.logger.logExecutionFailed(error.message, {
      traceId: requestId,
      durationMs,
      details: [
        `Confidence Evaluation Failed: ${error.message}`,
        error.stack || ''
      ]
    });
  }
}
