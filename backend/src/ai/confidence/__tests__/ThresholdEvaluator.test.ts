import { ThresholdEvaluator } from '../ThresholdEvaluator';
import { ConfidenceLevel, EvidenceQuality } from '../models/confidenceModels';

describe('ThresholdEvaluator', () => {
  let evaluator: ThresholdEvaluator;

  beforeEach(() => {
    evaluator = new ThresholdEvaluator({ highThreshold: 80, mediumThreshold: 50 });
  });

  it('should return HIGH confidence and no escalation for 85 and Good evidence', () => {
    const result = evaluator.evaluate(85, EvidenceQuality.GOOD);
    expect(result.confidenceLevel).toBe(ConfidenceLevel.HIGH);
    expect(result.escalationRequired).toBe(false);
  });

  it('should return MEDIUM confidence and no escalation for 60 and Acceptable evidence', () => {
    const result = evaluator.evaluate(60, EvidenceQuality.ACCEPTABLE);
    expect(result.confidenceLevel).toBe(ConfidenceLevel.MEDIUM);
    expect(result.escalationRequired).toBe(false);
  });

  it('should return LOW confidence and require escalation for 40', () => {
    const result = evaluator.evaluate(40, EvidenceQuality.ACCEPTABLE);
    expect(result.confidenceLevel).toBe(ConfidenceLevel.LOW);
    expect(result.escalationRequired).toBe(true);
    expect(result.escalationReason).toContain('below the acceptable medium threshold');
  });

  it('should require escalation for High confidence but INSUFFICIENT evidence', () => {
    const result = evaluator.evaluate(85, EvidenceQuality.INSUFFICIENT);
    expect(result.confidenceLevel).toBe(ConfidenceLevel.HIGH); // Numerical confidence is high, but...
    expect(result.escalationRequired).toBe(true);
    expect(result.escalationReason).toContain('Evidence quality is Insufficient');
  });
});
