import { ReasoningEvaluator } from '../ReasoningEvaluator';
import { DecisionState, StopReason } from '../../reasoning/models/decisionModels';

describe('ReasoningEvaluator', () => {
  let evaluator: ReasoningEvaluator;

  beforeEach(() => {
    evaluator = new ReasoningEvaluator();
  });

  const baseState: DecisionState = {
    executionId: 'test-123',
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

  it('should score 100 for perfect reasoning', () => {
    const result = evaluator.evaluate(baseState);
    expect(result.reasoningScore).toBe(100);
    expect(result.notes).toContain('Reasoning converged efficiently in 1 iterations.');
  });

  it('should penalize for too many iterations', () => {
    const result = evaluator.evaluate({ ...baseState, iterationCount: 4 });
    expect(result.reasoningScore).toBe(90);
    expect(result.notes).toContain('Reasoning required 4 iterations, indicating high complexity or instability.');
  });

  it('should heavily penalize for runtime safety limit', () => {
    const result = evaluator.evaluate({ ...baseState, stopReason: StopReason.SAFETY_LIMIT });
    expect(result.reasoningScore).toBe(50);
  });

  it('should penalize for unresolved uncertainties', () => {
    const state = {
      ...baseState,
      decisionResult: {
        ...baseState.decisionResult!,
        unresolvedUncertainties: ['A', 'B']
      }
    };
    const result = evaluator.evaluate(state);
    // Score = 100 - (2 * 10) = 80
    expect(result.reasoningScore).toBe(80);
    expect(result.notes).toContain('Decision has 2 unresolved uncertainties.');
  });

  it('should cap uncertainty penalty at 30', () => {
    const state = {
      ...baseState,
      decisionResult: {
        ...baseState.decisionResult!,
        unresolvedUncertainties: ['A', 'B', 'C', 'D']
      }
    };
    const result = evaluator.evaluate(state);
    // Score = 100 - Math.min(4 * 10, 30) = 70
    expect(result.reasoningScore).toBe(70);
  });
});
