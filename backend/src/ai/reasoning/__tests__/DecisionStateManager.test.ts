import { DecisionStateManager } from '../DecisionStateManager';
import { StopReason, type PerceptionResult, type ToolRequest, type Observation, type DecisionResult } from '../models';
import { randomUUID } from 'crypto';

describe('DecisionStateManager', () => {
  let stateManager: DecisionStateManager;
  const mockPerception: PerceptionResult = {
    detectedIssue: 'pothole',
    severityEstimate: 'high',
    visualObservations: ['large hole', 'water inside'],
    metadata: {
      imageRef: 'gs://bucket/img.jpg',
      latitude: 1.0,
      longitude: 2.0,
      timestamp: new Date().toISOString(),
    },
  };

  beforeEach(() => {
    stateManager = new DecisionStateManager();
  });

  it('should initialize a valid DecisionState', () => {
    const state = stateManager.createState(mockPerception);
    expect(state.executionId).toBeDefined();
    expect(state.perception).toEqual(mockPerception);
    expect(state.iterationCount).toBe(0);
    expect(state.stopped).toBe(false);
    expect(state.toolRequests).toHaveLength(0);
    expect(state.observations).toHaveLength(0);
  });

  it('should enforce append-only reasoning history (INV-05)', () => {
    let state = stateManager.createState(mockPerception);
    state = stateManager.addReasoningEntry(state, {
      stepType: 'initial_reasoning',
      description: 'Test entry',
    });

    expect(state.reasoningHistory).toHaveLength(1);
    expect(state.reasoningHistory[0].stepType).toBe('initial_reasoning');
    expect(state.reasoningHistory[0].iteration).toBe(0);

    state = stateManager.incrementIteration(state);
    state = stateManager.addReasoningEntry(state, {
      stepType: 'reasoning_update',
      description: 'Second entry',
    });

    expect(state.reasoningHistory).toHaveLength(2);
    expect(state.reasoningHistory[1].iteration).toBe(1);
  });

  it('should prevent mutating state after it is stopped (INV-06)', () => {
    let state = stateManager.createState(mockPerception);
    state = stateManager.markStopped(state, StopReason.SUFFICIENT_EVIDENCE);

    expect(state.stopped).toBe(true);

    expect(() => {
      stateManager.incrementIteration(state);
    }).toThrow(/Cannot mutate state after reasoning has stopped/);
  });

  it('should only allow DecisionResult to be set exactly once (INV-08)', () => {
    let state = stateManager.createState(mockPerception);
    const mockDecision: DecisionResult = {
      issueClassification: 'pothole',
      departmentRecommendation: 'roads',
      priorityRecommendation: 'high',
      reasoning: 'test',
      supportingEvidence: [],
      unresolvedUncertainties: [],
      escalationRecommendation: 'none',
      timestamp: new Date().toISOString(),
    };

    state = stateManager.setDecisionResult(state, mockDecision);
    expect(state.decisionResult).toBe(mockDecision);

    expect(() => {
      stateManager.setDecisionResult(state, mockDecision);
    }).toThrow(/Decision result has already been set/);
  });

  it('should enforce observation originates from a known tool request (INV-02)', () => {
    let state = stateManager.createState(mockPerception);
    
    const mockObservation: Observation = {
      observationId: randomUUID(),
      requestId: 'unknown-request-id',
      source: 'test-tool',
      type: 'test-type',
      payload: {},
      status: 'success',
      timestamp: new Date().toISOString(),
    };

    expect(() => {
      stateManager.addObservation(state, mockObservation);
    }).toThrow(/Observation references unknown Tool Request ID/);
  });
});
