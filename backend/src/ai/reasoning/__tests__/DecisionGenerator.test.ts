import { DecisionGenerator } from '../DecisionGenerator';
import type { IAIService } from '../../services/AIService';
import { AILogger } from '../../logging/aiLogger';
import { type DecisionState, type PerceptionResult } from '../models';
import { randomUUID } from 'crypto';
import { AIParsingError } from '../../exceptions';

describe('DecisionGenerator', () => {
  let mockAiService: jest.Mocked<IAIService>;
  let aiLogger: AILogger;
  let decisionGenerator: DecisionGenerator;
  let mockState: DecisionState;

  beforeEach(() => {
    mockAiService = {
      generateResponse: jest.fn(),
    };
    aiLogger = new AILogger('error');
    decisionGenerator = new DecisionGenerator({
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
        confirmedFacts: ['Pothole exists', 'Arterial road'],
        assumptions: [],
        uncertainties: [],
        evidenceRequirements: [],
      },
      evidencePlans: [],
      toolRequests: [],
      observations: [],
      reasoningHistory: [],
      iterationCount: 1,
      stopped: true,
      stopReason: 'SUFFICIENT_EVIDENCE' as any,
      decisionResult: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
    };
  });

  it('should generate a final decision result based on the state', async () => {
    const aiResponse = {
      issueClassification: 'Severe Pothole',
      departmentRecommendation: 'Department of Roads',
      priorityRecommendation: 'high',
      reasoning: 'It is on an arterial road and severe.',
      supportingEvidence: ['Pothole exists', 'Arterial road'],
      unresolvedUncertainties: [],
      escalationRecommendation: 'none',
    };

    mockAiService.generateResponse.mockResolvedValueOnce({
      promptId: 'decision' as any,
      promptVersion: '1.0.0',
      model: 'test-model',
      outputText: JSON.stringify(aiResponse),
      traceId: mockState.executionId,
      latencyMs: 100,
    });

    const result = await decisionGenerator.generateDecision(mockState);

    expect(result.issueClassification).toBe('Severe Pothole');
    expect(result.departmentRecommendation).toBe('Department of Roads');
    expect(result.priorityRecommendation).toBe('high');
    expect(result.reasoning).toBe('It is on an arterial road and severe.');
    expect(result.timestamp).toBeDefined();
  });

  it('should throw AIParsingError if response is entirely malformed', async () => {
    mockAiService.generateResponse.mockResolvedValueOnce({
      promptId: 'decision' as any,
      promptVersion: '1.0.0',
      model: 'test-model',
      outputText: 'This is not JSON',
      traceId: mockState.executionId,
      latencyMs: 100,
    });

    await expect(decisionGenerator.generateDecision(mockState)).rejects.toThrow(AIParsingError);
  });
});
