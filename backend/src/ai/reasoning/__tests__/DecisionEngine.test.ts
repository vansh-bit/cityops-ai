import { DecisionEngine } from '../DecisionEngine';
import { DecisionStateManager } from '../DecisionStateManager';
import { InitialReasoning } from '../InitialReasoning';
import { EvidencePlanner } from '../EvidencePlanner';
import { ObservationProcessor } from '../ObservationProcessor';
import { StoppingController } from '../StoppingController';
import { DecisionGenerator } from '../DecisionGenerator';
import { AILogger } from '../../logging/aiLogger';
import type { PerceptionResult, Observation } from '../models';
import { randomUUID } from 'crypto';

// Mocks
jest.mock('../DecisionStateManager');
jest.mock('../InitialReasoning');
jest.mock('../EvidencePlanner');
jest.mock('../ObservationProcessor');
jest.mock('../StoppingController');
jest.mock('../DecisionGenerator');

describe('DecisionEngine', () => {
  let aiLogger: AILogger;
  let stateManager: jest.Mocked<DecisionStateManager>;
  let initialReasoning: jest.Mocked<InitialReasoning>;
  let evidencePlanner: jest.Mocked<EvidencePlanner>;
  let observationProcessor: jest.Mocked<ObservationProcessor>;
  let stoppingController: jest.Mocked<StoppingController>;
  let decisionGenerator: jest.Mocked<DecisionGenerator>;
  let decisionEngine: DecisionEngine;

  beforeEach(() => {
    aiLogger = new AILogger('error');
    stateManager = new DecisionStateManager() as jest.Mocked<DecisionStateManager>;
    initialReasoning = new InitialReasoning({} as any) as jest.Mocked<InitialReasoning>;
    evidencePlanner = new EvidencePlanner({} as any) as jest.Mocked<EvidencePlanner>;
    observationProcessor = new ObservationProcessor({} as any) as jest.Mocked<ObservationProcessor>;
    stoppingController = new StoppingController({} as any) as jest.Mocked<StoppingController>;
    decisionGenerator = new DecisionGenerator({} as any) as jest.Mocked<DecisionGenerator>;

    decisionEngine = new DecisionEngine({
      aiLogger,
      stateManager,
      initialReasoning,
      evidencePlanner,
      observationProcessor,
      stoppingController,
      decisionGenerator,
    });
  });

  const mockPerception: PerceptionResult = {
    detectedIssue: 'pothole',
    severityEstimate: 'high',
    visualObservations: [],
    metadata: { imageRef: 'test', latitude: 0, longitude: 0, timestamp: '' },
  };

  const createMockState = () => ({
    executionId: randomUUID(),
    perception: mockPerception,
    reasoningContext: { confirmedFacts: [], assumptions: [], uncertainties: [], evidenceRequirements: [] },
    evidencePlans: [],
    toolRequests: [],
    observations: [],
    reasoningHistory: [],
    iterationCount: 0,
    stopped: false,
    stopReason: null,
    decisionResult: null,
    startedAt: new Date().toISOString(),
    completedAt: null,
  });

  describe('startReasoning', () => {
    it('should run initial reasoning, check stopping, and generate decision if sufficient', async () => {
      const state = createMockState();
      
      stateManager.createState.mockReturnValue(state);
      initialReasoning.analyze.mockResolvedValue({
        confirmedFacts: [], assumptions: [], uncertainties: [], evidenceRequirements: []
      });
      stateManager.updateReasoningContext.mockImplementation((s) => s);
      stateManager.addReasoningEntry.mockImplementation((s) => s);
      
      stoppingController.shouldStop.mockReturnValue({ shouldStop: true, reason: 'SUFFICIENT_EVIDENCE' as any });
      stateManager.markStopped.mockImplementation((s) => ({ ...s, stopped: true, stopReason: 'SUFFICIENT_EVIDENCE' as any }));
      
      decisionGenerator.generateDecision.mockResolvedValue({} as any);
      stateManager.setDecisionResult.mockImplementation((s) => s);

      const result = await decisionEngine.startReasoning(mockPerception);

      expect(stateManager.createState).toHaveBeenCalledWith(mockPerception);
      expect(initialReasoning.analyze).toHaveBeenCalled();
      expect(stoppingController.shouldStop).toHaveBeenCalled();
      expect(evidencePlanner.planEvidence).not.toHaveBeenCalled();
      expect(decisionGenerator.generateDecision).toHaveBeenCalled();
      
      expect(result.state.stopped).toBe(true);
      expect(result.isComplete).toBe(true);
    });

    it('should plan evidence if not stopping', async () => {
      const state = createMockState();
      
      stateManager.createState.mockReturnValue(state);
      initialReasoning.analyze.mockResolvedValue({} as any);
      stateManager.updateReasoningContext.mockImplementation((s) => s);
      stateManager.addReasoningEntry.mockImplementation((s) => s);
      
      stoppingController.shouldStop.mockReturnValue({ shouldStop: false });
      
      const mockToolReq = { requestId: '123', toolId: 'test', reason: '', inputs: {}, expectedObservation: '', originatingStep: 1, timestamp: '' };
      evidencePlanner.planEvidence.mockResolvedValue(mockToolReq);
      stateManager.addToolRequest.mockImplementation((s) => s);

      const result = await decisionEngine.startReasoning(mockPerception);

      expect(stoppingController.shouldStop).toHaveBeenCalled();
      expect(evidencePlanner.planEvidence).toHaveBeenCalled();
      expect(decisionGenerator.generateDecision).not.toHaveBeenCalled();
      
      expect(result.isComplete).toBe(false);
      expect(result.toolRequest).toEqual(mockToolReq);
    });
  });

  describe('processObservationAndContinue', () => {
    it('should process observation and continue to decision if stopping criteria met', async () => {
      let state = createMockState();
      const obs: Observation = { observationId: '1', source: 't', type: 't', payload: {}, status: 'success', requestId: '1', timestamp: '' };
      
      observationProcessor.processObservation.mockResolvedValue(state);
      stoppingController.shouldStop.mockReturnValue({ shouldStop: true, reason: 'SUFFICIENT_EVIDENCE' as any });
      stateManager.markStopped.mockImplementation((s) => ({ ...s, stopped: true, stopReason: 'SUFFICIENT_EVIDENCE' as any }));
      stateManager.addReasoningEntry.mockImplementation((s) => s);
      
      decisionGenerator.generateDecision.mockResolvedValue({} as any);
      stateManager.setDecisionResult.mockImplementation((s) => s);

      const result = await decisionEngine.processObservationAndContinue(state, obs);

      expect(observationProcessor.processObservation).toHaveBeenCalledWith(state, obs);
      expect(stoppingController.shouldStop).toHaveBeenCalled();
      expect(decisionGenerator.generateDecision).toHaveBeenCalled();
      expect(result.isComplete).toBe(true);
    });

    it('should process observation and request another tool if not stopping', async () => {
      let state = createMockState();
      const obs: Observation = { observationId: '1', source: 't', type: 't', payload: {}, status: 'success', requestId: '1', timestamp: '' };
      
      observationProcessor.processObservation.mockResolvedValue(state);
      stoppingController.shouldStop.mockReturnValue({ shouldStop: false });
      
      const mockToolReq = { requestId: '123', toolId: 'test', reason: '', inputs: {}, expectedObservation: '', originatingStep: 1, timestamp: '' };
      evidencePlanner.planEvidence.mockResolvedValue(mockToolReq);
      stateManager.addToolRequest.mockImplementation((s) => s);

      const result = await decisionEngine.processObservationAndContinue(state, obs);

      expect(observationProcessor.processObservation).toHaveBeenCalledWith(state, obs);
      expect(stoppingController.shouldStop).toHaveBeenCalled();
      expect(evidencePlanner.planEvidence).toHaveBeenCalled();
      expect(result.isComplete).toBe(false);
    });
  });
});
