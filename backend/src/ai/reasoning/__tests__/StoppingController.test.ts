import { StoppingController } from '../StoppingController';
import { AILogger } from '../../logging/aiLogger';
import { type DecisionState, type PerceptionResult, StopReason } from '../models';
import { randomUUID } from 'crypto';

describe('StoppingController', () => {
  let aiLogger: AILogger;
  let stoppingController: StoppingController;
  let mockState: DecisionState;

  beforeEach(() => {
    aiLogger = new AILogger('error');
    stoppingController = new StoppingController({
      aiLogger,
      maxIterations: 3,
    });

    const perception: PerceptionResult = {
      detectedIssue: 'pothole',
      severityEstimate: 'high',
      visualObservations: [],
      metadata: { imageRef: 'test', latitude: 0, longitude: 0, timestamp: '' },
    };

    mockState = {
      executionId: randomUUID(),
      perception,
      reasoningContext: {
        confirmedFacts: [],
        assumptions: [],
        uncertainties: ['Is it a major road?'],
        evidenceRequirements: ['Need road classification'],
      },
      evidencePlans: [],
      toolRequests: [],
      observations: [],
      reasoningHistory: [],
      iterationCount: 1,
      stopped: false,
      stopReason: null,
      decisionResult: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
    };
  });

  it('should not stop when uncertainties exist and iteration count is below max (Deterministic criteria)', () => {
    const result = stoppingController.shouldStop(mockState);
    expect(result.shouldStop).toBe(false);
    expect(result.reason).toBeUndefined();
  });

  it('should stop when sufficient evidence exists (no uncertainties) (Stopping criteria)', () => {
    mockState.reasoningContext.uncertainties = [];
    const result = stoppingController.shouldStop(mockState);
    
    expect(result.shouldStop).toBe(true);
    expect(result.reason).toBe(StopReason.SUFFICIENT_EVIDENCE);
  });

  it('should stop exactly when maximum iterations are reached (Maximum iteration enforcement)', () => {
    mockState.iterationCount = 2;
    expect(stoppingController.shouldStop(mockState).shouldStop).toBe(false);

    mockState.iterationCount = 3;
    const result = stoppingController.shouldStop(mockState);
    
    expect(result.shouldStop).toBe(true);
    expect(result.reason).toBe(StopReason.MAX_ITERATIONS);
  });

  it('should stop when maximum iterations are exceeded (Boundary conditions)', () => {
    mockState.iterationCount = 4; // Exceeding max iterations
    const result = stoppingController.shouldStop(mockState);
    
    expect(result.shouldStop).toBe(true);
    expect(result.reason).toBe(StopReason.MAX_ITERATIONS);
  });

  it('should stop when maximum tool requests are reached (Correct behavior when runtime limits are reached)', () => {
    // 3 tool requests generated implies we have reached max bounds
    mockState.toolRequests = [
      { requestId: '1', toolId: 't1', reason: '', originatingStep: 0, timestamp: '', expectedObservation: '', inputs: {} },
      { requestId: '2', toolId: 't2', reason: '', originatingStep: 1, timestamp: '', expectedObservation: '', inputs: {} },
      { requestId: '3', toolId: 't3', reason: '', originatingStep: 2, timestamp: '', expectedObservation: '', inputs: {} },
    ];
    mockState.iterationCount = 1; // Even if iterationCount is low, tool limit takes precedence

    const result = stoppingController.shouldStop(mockState);
    
    expect(result.shouldStop).toBe(true);
    expect(result.reason).toBe(StopReason.MAX_ITERATIONS);
  });

  it('should handle undefined reasoning context gracefully (Failure scenarios)', () => {
    // @ts-ignore - deliberately corrupting state to test robustness
    mockState.reasoningContext = undefined;
    
    // It shouldn't crash, it should just not stop on SUFFICIENT_EVIDENCE
    const result = stoppingController.shouldStop(mockState);
    expect(result.shouldStop).toBe(false);
  });

  it('should respect custom maxIterations configuration', () => {
    const customController = new StoppingController({
      aiLogger,
      maxIterations: 5,
    });

    mockState.iterationCount = 4;
    expect(customController.shouldStop(mockState).shouldStop).toBe(false);

    mockState.iterationCount = 5;
    expect(customController.shouldStop(mockState).shouldStop).toBe(true);
    expect(customController.shouldStop(mockState).reason).toBe(StopReason.MAX_ITERATIONS);
  });
});
