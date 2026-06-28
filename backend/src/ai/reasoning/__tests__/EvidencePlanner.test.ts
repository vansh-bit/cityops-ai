import { EvidencePlanner } from '../EvidencePlanner';
import type { IAIService } from '../../services/AIService';
import { AILogger } from '../../logging/aiLogger';
import { type DecisionState, type PerceptionResult } from '../models';
import { randomUUID } from 'crypto';
import { AIParsingError } from '../../exceptions';

describe('EvidencePlanner', () => {
  let mockAiService: jest.Mocked<IAIService>;
  let aiLogger: AILogger;
  let evidencePlanner: EvidencePlanner;
  let mockState: DecisionState;

  beforeEach(() => {
    mockAiService = {
      generateResponse: jest.fn(),
    };
    aiLogger = new AILogger('error');
    evidencePlanner = new EvidencePlanner({
      aiService: mockAiService,
      aiLogger,
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

  it('should return a ToolRequest when evidence is needed (Deterministic planning)', async () => {
    const aiResponse = {
      requiresTool: true,
      evidencePlan: {
        missingInformation: 'Road classification',
        requiredTool: 'getRoadMetadata',
        justification: 'Determine if this is a major road',
        expectedObservation: 'Road type and speed limit',
        inputs: { lat: 0, lng: 0 },
      },
    };

    mockAiService.generateResponse.mockResolvedValueOnce({
      promptId: 'tool-selection',
      promptVersion: '1.0.0',
      model: 'test-model',
      outputText: JSON.stringify(aiResponse),
      traceId: mockState.executionId,
      latencyMs: 100,
    });

    const result = await evidencePlanner.planEvidence(mockState);

    expect(result).not.toBeNull();
    expect(result?.toolId).toBe('getRoadMetadata');
    expect(result?.reason).toBe('Determine if this is a major road');
    expect(result?.originatingStep).toBe(1);
    expect(result?.requestId).toBeDefined();
    expect(result?.inputs).toEqual({ lat: 0, lng: 0 });
    expect(result?.expectedObservation).toBe('Road type and speed limit');
  });

  it('should default empty inputs if the AI omits them (Boundary condition)', async () => {
    const aiResponse = {
      requiresTool: true,
      evidencePlan: {
        missingInformation: 'Road classification',
        requiredTool: 'getRoadMetadata',
        justification: 'Determine if this is a major road',
        expectedObservation: 'Road type',
      },
    };

    mockAiService.generateResponse.mockResolvedValueOnce({
      promptId: 'tool-selection',
      promptVersion: '1.0.0',
      model: 'test-model',
      outputText: JSON.stringify(aiResponse),
      traceId: mockState.executionId,
      latencyMs: 100,
    });

    const result = await evidencePlanner.planEvidence(mockState);
    expect(result?.inputs).toEqual({});
  });

  it('should return null when no tool is required (Edge case defined by spec)', async () => {
    const aiResponse = {
      requiresTool: false,
    };

    mockAiService.generateResponse.mockResolvedValueOnce({
      promptId: 'tool-selection',
      promptVersion: '1.0.0',
      model: 'test-model',
      outputText: JSON.stringify(aiResponse),
      traceId: mockState.executionId,
      latencyMs: 100,
    });

    const result = await evidencePlanner.planEvidence(mockState);
    expect(result).toBeNull();
  });

  it('should throw AIParsingError if response is entirely malformed (Failure scenario)', async () => {
    mockAiService.generateResponse.mockResolvedValueOnce({
      promptId: 'tool-selection',
      promptVersion: '1.0.0',
      model: 'test-model',
      outputText: 'This is not JSON',
      traceId: mockState.executionId,
      latencyMs: 100,
    });

    await expect(evidencePlanner.planEvidence(mockState)).rejects.toThrow(AIParsingError);
  });

  it('should throw AIParsingError if requiresTool is true but missing required evidence plan details', async () => {
    const aiResponse = {
      requiresTool: true,
      evidencePlan: {
        missingInformation: 'Missing requiredTool and justification',
      }
    };

    mockAiService.generateResponse.mockResolvedValueOnce({
      promptId: 'tool-selection',
      promptVersion: '1.0.0',
      model: 'test-model',
      outputText: JSON.stringify(aiResponse),
      traceId: mockState.executionId,
      latencyMs: 100,
    });

    await expect(evidencePlanner.planEvidence(mockState)).rejects.toThrow(AIParsingError);
  });
});
