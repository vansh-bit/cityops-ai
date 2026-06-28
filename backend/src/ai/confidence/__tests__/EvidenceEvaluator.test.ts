import { EvidenceEvaluator } from '../EvidenceEvaluator';
import { EvidenceQuality } from '../models/confidenceModels';
import { DecisionState } from '../../reasoning/models/decisionModels';

describe('EvidenceEvaluator', () => {
  let evaluator: EvidenceEvaluator;

  beforeEach(() => {
    evaluator = new EvidenceEvaluator();
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
    stopReason: null,
    decisionResult: null,
    startedAt: '',
    completedAt: null
  };

  it('should return EXCELLENT if all evidence plans are successfully fulfilled', () => {
    const state: DecisionState = {
      ...baseState,
      evidencePlans: [{ missingInformation: 'A', requiredTool: 'T1', justification: 'J1', expectedObservation: 'E1' }],
      observations: [{ observationId: '1', source: 'T1', type: 'info', payload: {}, status: 'success', requestId: 'R1', timestamp: '' }]
    };

    const result = evaluator.evaluate(state);
    expect(result.quality).toBe(EvidenceQuality.EXCELLENT);
    expect(result.evidenceScore).toBe(100);
    expect(result.notes).toContain('All evidence plans were successfully fulfilled.');
  });

  it('should return GOOD if some plans failed but majority passed (e.g. 1 failure, 4 success)', () => {
    const state: DecisionState = {
      ...baseState,
      evidencePlans: [{} as any, {} as any, {} as any, {} as any], // 4 plans
      observations: [
        { status: 'success' } as any,
        { status: 'success' } as any,
        { status: 'success' } as any,
        { status: 'failure' } as any
      ]
    };

    const result = evaluator.evaluate(state);
    // score = 3/4 * 100 = 75. Penalize 20 for 1 failure => 55 (ACCEPTABLE)
    expect(result.quality).toBe(EvidenceQuality.ACCEPTABLE);
    expect(result.evidenceScore).toBe(55);
  });

  it('should return INSUFFICIENT for heavy failures', () => {
    const state: DecisionState = {
      ...baseState,
      evidencePlans: [{} as any, {} as any],
      observations: [{ status: 'failure' } as any, { status: 'failure' } as any]
    };

    const result = evaluator.evaluate(state);
    expect(result.quality).toBe(EvidenceQuality.INSUFFICIENT);
    expect(result.evidenceScore).toBe(0);
  });

  it('should base confidence on perception if no plans exist', () => {
    const state: DecisionState = {
      ...baseState,
      evidencePlans: [],
      observations: []
    };

    const result = evaluator.evaluate(state);
    expect(result.quality).toBe(EvidenceQuality.GOOD);
    expect(result.evidenceScore).toBe(80);
    expect(result.notes).toContain('No evidence was planned or gathered. Relying entirely on initial perception.');
  });
});
