import { ConfidenceLevel, ThresholdConfig, EvidenceQuality } from './models/confidenceModels';

export class ThresholdEvaluator {
  constructor(private readonly config: ThresholdConfig) {}

  /**
   * Compares confidence score against thresholds to determine level and escalation requirements.
   */
  public evaluate(confidenceValue: number, evidenceQuality: EvidenceQuality): { 
    confidenceLevel: ConfidenceLevel; 
    escalationRequired: boolean;
    escalationReason?: string;
  } {
    let confidenceLevel: ConfidenceLevel;
    let escalationRequired = false;
    let escalationReason: string | undefined;

    if (confidenceValue >= this.config.highThreshold) {
      confidenceLevel = ConfidenceLevel.HIGH;
    } else if (confidenceValue >= this.config.mediumThreshold) {
      confidenceLevel = ConfidenceLevel.MEDIUM;
    } else {
      confidenceLevel = ConfidenceLevel.LOW;
    }

    // Determine escalation logic based on thresholds and evidence
    if (confidenceLevel === ConfidenceLevel.LOW) {
      escalationRequired = true;
      escalationReason = 'Confidence value is below the acceptable medium threshold.';
    } else if (evidenceQuality === EvidenceQuality.INSUFFICIENT || evidenceQuality === EvidenceQuality.WEAK) {
      escalationRequired = true;
      escalationReason = `Evidence quality is ${evidenceQuality}, which forces an escalation regardless of raw confidence.`;
    }

    return { confidenceLevel, escalationRequired, escalationReason };
  }
}
