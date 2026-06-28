import { InitialReasoning } from '../InitialReasoning';
import type { IAIService } from '../../services/AIService';
import { AILogger } from '../../logging/aiLogger';
import type { PerceptionResult, ReasoningContext } from '../models';
import { AIParsingError } from '../../exceptions';

describe('InitialReasoning', () => {
  let mockAiService: jest.Mocked<IAIService>;
  let aiLogger: AILogger;
  let initialReasoning: InitialReasoning;

  beforeEach(() => {
    mockAiService = {
      generateResponse: jest.fn(),
    };
    aiLogger = new AILogger('error');
    initialReasoning = new InitialReasoning({
      aiService: mockAiService,
      aiLogger,
    });
  });

  const mockPerception: PerceptionResult = {
    detectedIssue: 'pothole',
    severityEstimate: 'high',
    visualObservations: ['large hole in road'],
    metadata: { imageRef: 'test', latitude: 0, longitude: 0, timestamp: '' },
  };

  it('should parse AI response and return a valid ReasoningContext', async () => {
    const aiResponse = {
      confirmedFacts: ['Pothole exists'],
      assumptions: ['May damage cars'],
      uncertainties: ['Is it a major arterial road?'],
      evidenceRequirements: ['Road classification'],
    };

    mockAiService.generateResponse.mockResolvedValueOnce({
      promptId: 'decision' as any,
      promptVersion: '1.0.0',
      model: 'test-model',
      outputText: JSON.stringify(aiResponse),
      traceId: 'test-trace',
      latencyMs: 100,
    });

    const result = await initialReasoning.analyze(mockPerception, 'test-execution-id');

    expect(result.confirmedFacts).toEqual(['Pothole exists']);
    expect(result.assumptions).toEqual(['May damage cars']);
    expect(result.uncertainties).toEqual(['Is it a major arterial road?']);
    expect(result.evidenceRequirements).toEqual(['Road classification']);
  });

  it('should throw AIParsingError if response is entirely malformed', async () => {
    mockAiService.generateResponse.mockResolvedValueOnce({
      promptId: 'decision' as any,
      promptVersion: '1.0.0',
      model: 'test-model',
      outputText: 'This is not JSON',
      traceId: 'test-trace',
      latencyMs: 100,
    });

    await expect(initialReasoning.analyze(mockPerception, 'test-execution-id')).rejects.toThrow(AIParsingError);
  });
});
