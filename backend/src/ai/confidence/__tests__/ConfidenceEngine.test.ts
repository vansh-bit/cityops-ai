import { ConfidenceEngine, ConfidenceEvaluationError } from '../ConfidenceEngine';
import { EvidenceEvaluator } from '../EvidenceEvaluator';
import { ReasoningEvaluator } from '../ReasoningEvaluator';
import { ThresholdEvaluator } from '../ThresholdEvaluator';
import { ReviewEvaluator } from '../ReviewEvaluator';
import { ConfidenceLogger } from '../ConfidenceLogger';
import { AILogger } from '../../logging/aiLogger';
import { DecisionState, StopReason } from '../../reasoning/models/decisionModels';

describe('ConfidenceEngine', () => {
  let engine: ConfidenceEngine;
  let mockLogger: jest.Mocked<ConfidenceLogger>;

  beforeEach(() => {
    mockLogger = {
      logEvaluation: jest.fn(),
      logFailure: jest.fn()
    } as unknown as jest.Mocked<ConfidenceLogger>;

    engine = new ConfidenceEngine(
      new EvidenceEvaluator(),
      new ReasoningEvaluator(),
      new ThresholdEvaluator({ highThreshold: 80, mediumThreshold: 50 }),
      new ReviewEvaluator(),
      mockLogger
    );
  });

  const baseState: DecisionState = {
    executionId: 'exec-1',
    perception: {} as any,
    reasoningContext: {} as any,
    evidencePlans: [],
    toolRequests: [],
    observations: [],
    reasoningHistory: [],
    iterationCount: 1,
    stopped: true,
    stopReason: StopReason.SUFFICIENT_EVIDENCE,
    decisionResult: { 
      issueClassification: 'Test', 
      departmentRecommendation: 'Test', 
      priorityRecommendation: 'High', 
      reasoning: 'Test', 
      supportingEvidence: [], 
      unresolvedUncertainties: [], 
      escalationRecommendation: 'None', 
      timestamp: '' 
    },
    startedAt: '',
    completedAt: null
  };

  it('should evaluate valid decision state successfully', () => {
    const result = engine.evaluate(baseState);
    expect(result.decisionId).toBe('exec-1');
    expect(result.metadata.confidenceValue).toBeDefined(); // (80 + 100) / 2 = 90
    expect(result.metadata.confidenceLevel).toBe('High Confidence');
    expect(mockLogger.logEvaluation).toHaveBeenCalled();
  });

  it('should throw ConfidenceEvaluationError if decisionResult is missing', () => {
    const state = { ...baseState, decisionResult: null };
    expect(() => engine.evaluate(state)).toThrow(ConfidenceEvaluationError);
    expect(mockLogger.logFailure).toHaveBeenCalled();
  });

  it('should throw ConfidenceEvaluationError if reasoning is not completed', () => {
    const state = { ...baseState, stopped: false };
    expect(() => engine.evaluate(state)).toThrow(ConfidenceEvaluationError);
    expect(mockLogger.logFailure).toHaveBeenCalled();
  });

  it('should throw ConfidenceEvaluationError if observations are missing', () => {
    const state = { ...baseState, observations: undefined as any };
    expect(() => engine.evaluate(state)).toThrow(ConfidenceEvaluationError);
    expect(mockLogger.logFailure).toHaveBeenCalled();
  });
});
