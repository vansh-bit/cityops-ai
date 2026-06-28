import { ObservationProcessor } from '../ObservationProcessor';
import type { IAIService } from '../../services/AIService';
import { AILogger } from '../../logging/aiLogger';
import { DecisionStateManager } from '../DecisionStateManager';
import { type DecisionState, type PerceptionResult, type Observation } from '../models';
import { randomUUID } from 'crypto';
import { AIParsingError } from '../../exceptions';

describe('ObservationProcessor', () => {
  let mockAiService: jest.Mocked<IAIService>;
  let aiLogger: AILogger;
  let stateManager: DecisionStateManager;
  let observationProcessor: ObservationProcessor;
  let mockState: DecisionState;

  beforeEach(() => {
    mockAiService = {
      generateResponse: jest.fn(),
    };
    aiLogger = new AILogger('error');
    stateManager = new DecisionStateManager();
    observationProcessor = new ObservationProcessor({
      aiService: mockAiService,
      aiLogger,
      stateManager,
    });

    const perception: PerceptionResult = {
      detectedIssue: 'pothole',
      severityEstimate: 'high',
      visualObservations: [],
      metadata: { imageRef: 'test', latitude: 0, longitude: 0, timestamp: '' },
    };

    mockState = stateManager.createState(perception);
    mockState.reasoningContext.uncertainties = ['Is it a major road?'];
    mockState.reasoningContext.evidenceRequirements = ['Need road classification'];
  });

  it('should process an observation and return updated state', async () => {
    const mockObservation: Observation = {
      observationId: randomUUID(),
      source: 'getRoadMetadata',
      type: 'road_data',
      payload: { classification: 'arterial', speedLimit: 45 },
      status: 'success',
      requestId: 'test-req-id',
      timestamp: new Date().toISOString(),
    };

    // Have to add the tool request to the state first to satisfy INV-02
    mockState.toolRequests = [
      {
        requestId: 'test-req-id',
        toolId: 'getRoadMetadata',
        reason: 'check',
        inputs: {},
        expectedObservation: 'road data',
        originatingStep: 1,
        timestamp: new Date().toISOString()
      }
    ];

    const aiResponse = {
      confirmedFacts: ['Pothole exists', 'Road is arterial'],
      assumptions: ['May damage cars'],
      uncertainties: [],
      evidenceRequirements: [],
    };

    mockAiService.generateResponse.mockResolvedValueOnce({
      promptId: 'decision' as any,
      promptVersion: '1.0.0',
      model: 'test-model',
      outputText: JSON.stringify(aiResponse),
      traceId: mockState.executionId,
      latencyMs: 100,
    });

    const updatedState = await observationProcessor.processObservation(mockState, mockObservation);

    expect(updatedState.observations).toHaveLength(1);
    expect(updatedState.reasoningContext.confirmedFacts).toContain('Road is arterial');
    expect(updatedState.reasoningContext.uncertainties).toHaveLength(0);

  });

  it('should throw AIParsingError if response is malformed', async () => {
    const mockObservation: Observation = {
      observationId: randomUUID(),
      source: 'getRoadMetadata',
      type: 'road_data',
      payload: { classification: 'arterial', speedLimit: 45 },
      status: 'success',
      requestId: 'test-req-id',
      timestamp: new Date().toISOString(),
    };

    mockState.toolRequests = [
      {
        requestId: 'test-req-id',
        toolId: 'getRoadMetadata',
        reason: 'check',
        inputs: {},
        expectedObservation: 'road data',
        originatingStep: 1,
        timestamp: new Date().toISOString()
      }
    ];

    mockAiService.generateResponse.mockResolvedValueOnce({
      promptId: 'decision' as any,
      promptVersion: '1.0.0',
      model: 'test-model',
      outputText: 'Bad JSON',
      traceId: mockState.executionId,
      latencyMs: 100,
    });

    await expect(observationProcessor.processObservation(mockState, mockObservation)).rejects.toThrow(AIParsingError);
  });
});
