import { DecisionState } from '../reasoning/models/decisionModels';
import { EvidenceEvaluator } from './EvidenceEvaluator';
import { ReasoningEvaluator } from './ReasoningEvaluator';
import { ThresholdEvaluator } from './ThresholdEvaluator';
import { ReviewEvaluator } from './ReviewEvaluator';
import { ConfidenceLogger } from './ConfidenceLogger';
import { ConfidenceEvaluationResult, ConfidenceMetadata } from './models/confidenceModels';

export class ConfidenceEvaluationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfidenceEvaluationError';
  }
}

export class ConfidenceEngine {
  constructor(
    private readonly evidenceEvaluator: EvidenceEvaluator,
    private readonly reasoningEvaluator: ReasoningEvaluator,
    private readonly thresholdEvaluator: ThresholdEvaluator,
    private readonly reviewEvaluator: ReviewEvaluator,
    private readonly logger: ConfidenceLogger
  ) {}

  /**
   * Executes the deterministic confidence evaluation lifecycle.
   * Does NOT modify the DecisionState.
   */
  public evaluate(state: DecisionState): ConfidenceEvaluationResult {
    const startTime = Date.now();
    
    try {
      // Stage 1 - Input Validation
      this.validateInput(state);

      // Stage 2 - Evidence Assessment
      const evidenceAssessment = this.evidenceEvaluator.evaluate(state);

      // Stage 3 - Reasoning Assessment
      const reasoningAssessment = this.reasoningEvaluator.evaluate(state);

      // Stage 3.5 - Confidence Calculation
      // Deterministic average of reasoning and evidence scores
      const rawConfidence = (evidenceAssessment.evidenceScore + reasoningAssessment.reasoningScore) / 2;
      const confidenceValue = Math.round(rawConfidence);

      // Stage 4 - Threshold Evaluation
      const thresholdAssessment = this.thresholdEvaluator.evaluate(confidenceValue, evidenceAssessment.quality);

      // Stage 5 - Recommendation Generation
      const reviewRecommendation = this.reviewEvaluator.evaluate(
        thresholdAssessment.escalationRequired,
        thresholdAssessment.confidenceLevel,
        evidenceAssessment.quality
      );

      const metadata: ConfidenceMetadata = {
        confidenceValue,
        confidenceLevel: thresholdAssessment.confidenceLevel,
        evidenceQuality: evidenceAssessment.quality,
        evaluationSummary: 'Confidence evaluated deterministically based on reasoning stability and evidence quality.',
        supportingFactors: [...evidenceAssessment.notes, ...reasoningAssessment.notes],
        escalationRequired: thresholdAssessment.escalationRequired,
        escalationReason: thresholdAssessment.escalationReason,
        reviewRecommendation
      };

      const result: ConfidenceEvaluationResult = {
        decisionId: state.executionId,
        requestId: state.executionId, // Request tracking ID
        metadata,
        evaluatedAt: new Date().toISOString()
      };

      this.logger.logEvaluation(result, Date.now() - startTime);

      return result;

    } catch (error) {
      if (error instanceof Error) {
        this.logger.logFailure(state.executionId, error, Date.now() - startTime);
      }
      throw error;
    }
  }

  private validateInput(state: DecisionState): void {
    if (!state.decisionResult) {
      throw new ConfidenceEvaluationError('Cannot evaluate confidence: Decision Result is missing.');
    }
    
    if (!state.stopped) {
      throw new ConfidenceEvaluationError('Cannot evaluate confidence: Reasoning is not completed.');
    }
    
    if (!state.observations || !Array.isArray(state.observations)) {
      throw new ConfidenceEvaluationError('Cannot evaluate confidence: Observation history is unavailable.');
    }
  }
}
