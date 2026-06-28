import { ReviewEvaluator } from '../ReviewEvaluator';
import { ConfidenceLevel, EvidenceQuality, ReviewRecommendation } from '../models/confidenceModels';

describe('ReviewEvaluator', () => {
  let evaluator: ReviewEvaluator;

  beforeEach(() => {
    evaluator = new ReviewEvaluator();
  });

  it('should require review if escalation is required', () => {
    const result = evaluator.evaluate(true, ConfidenceLevel.HIGH, EvidenceQuality.EXCELLENT);
    expect(result).toBe(ReviewRecommendation.REQUIRED);
  });

  it('should recommend optional review if confidence is MEDIUM', () => {
    const result = evaluator.evaluate(false, ConfidenceLevel.MEDIUM, EvidenceQuality.GOOD);
    expect(result).toBe(ReviewRecommendation.OPTIONAL);
  });

  it('should recommend optional review if evidence is ACCEPTABLE', () => {
    const result = evaluator.evaluate(false, ConfidenceLevel.HIGH, EvidenceQuality.ACCEPTABLE);
    expect(result).toBe(ReviewRecommendation.OPTIONAL);
  });

  it('should not require review if confidence is HIGH and evidence is GOOD or better', () => {
    const result = evaluator.evaluate(false, ConfidenceLevel.HIGH, EvidenceQuality.GOOD);
    expect(result).toBe(ReviewRecommendation.NOT_REQUIRED);
  });
});
