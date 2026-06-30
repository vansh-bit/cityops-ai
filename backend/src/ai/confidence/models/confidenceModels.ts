export enum EvidenceQuality {
  EXCELLENT = 'Excellent',
  GOOD = 'Good',
  ACCEPTABLE = 'Acceptable',
  WEAK = 'Weak',
  INSUFFICIENT = 'Insufficient'
}

export enum ConfidenceLevel {
  HIGH = 'High Confidence',
  MEDIUM = 'Medium Confidence',
  LOW = 'Low Confidence'
}

export enum ReviewRecommendation {
  REQUIRED = 'Human Review Required',
  OPTIONAL = 'Human Review Optional',
  NOT_REQUIRED = 'Human Review Not Required'
}

export interface ThresholdConfig {
  highThreshold: number; // e.g. 80
  mediumThreshold: number; // e.g. 50
}

export interface ConfidenceExplanation {
  evidenceScore: number;
  reasoningScore: number;
  positiveFactors: string[];
  negativeFactors: string[];
  recommendation: string;
}

export interface ConfidenceMetadata {
  confidenceValue: number; // 0 to 100
  confidenceLevel: ConfidenceLevel;
  evaluationSummary: string;
  supportingFactors: string[]; // Keeping for backward compatibility
  explanation: ConfidenceExplanation;
  evidenceQuality: EvidenceQuality;
  escalationRequired: boolean;
  escalationReason?: string;
  reviewRecommendation: ReviewRecommendation;
}

export interface ConfidenceEvaluationResult {
  decisionId: string;
  requestId: string;
  metadata: ConfidenceMetadata;
  evaluatedAt: string;
}
