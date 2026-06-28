import { ReviewRecommendation, ConfidenceLevel, EvidenceQuality } from './models/confidenceModels';

export class ReviewEvaluator {
  /**
   * Recommends if Human Review is required based on escalation status and confidence factors.
   */
  public evaluate(
    escalationRequired: boolean,
    confidenceLevel: ConfidenceLevel,
    evidenceQuality: EvidenceQuality
  ): ReviewRecommendation {
    if (escalationRequired) {
      return ReviewRecommendation.REQUIRED;
    }

    if (confidenceLevel === ConfidenceLevel.MEDIUM || evidenceQuality === EvidenceQuality.ACCEPTABLE) {
      return ReviewRecommendation.OPTIONAL;
    }

    return ReviewRecommendation.NOT_REQUIRED;
  }
}
