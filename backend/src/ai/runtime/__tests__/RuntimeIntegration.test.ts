import { RuntimeFactory } from '../../factory/RuntimeFactory';
import { PerceptionResult } from '../../reasoning/models/decisionModels';
import { GeminiVisionAdapter } from '../../../evidence/adapters/GeminiVisionAdapter';
import { initializeAIConfig } from '../../config/aiConfig';
import { initializeGemini } from '../../../config/gemini';

// Mock the Gemini adapter so we don't make real network calls
jest.mock('../../../evidence/adapters/GeminiVisionAdapter');

// Mock DefaultAIService so we don't make real Gemini calls during integration
jest.mock('../../services/AIService', () => {
  return {
    DefaultAIService: jest.fn().mockImplementation(() => {
      return {
        generateResponse: jest.fn().mockResolvedValue({
          promptId: 'decision',
          promptVersion: '1.0.0',
          model: 'test-model',
          outputText: JSON.stringify({
            // InitialReasoning fields
            confirmedFacts: ['Pothole exists'],
            assumptions: [],
            uncertainties: [],
            evidenceRequirements: [],
            // EvidencePlanner fields
            requiresTool: false,
            // ObservationProcessor fields
            relevantFacts: ['It is a big hole'],
            contradictions: [],
            resolvedUncertainties: [],
            newUncertainties: [],
            // DecisionGenerator fields
            issueClassification: 'POTHOLE',
            departmentRecommendation: 'TRANSPORT',
            priorityRecommendation: 'HIGH',
            reasoning: 'Large hole reported',
            supportingEvidence: [],
            unresolvedUncertainties: [],
            escalationRecommendation: 'None'
          }),
          traceId: 'test',
          requestId: 'test',
          latencyMs: 100,
          usage: { totalTokenCount: 10 }
        })
      };
    })
  };
});

describe('Runtime Integration', () => {
  beforeAll(async () => {
    process.env.GEMINI_API_KEY = 'test_key';
    const mockConfig = { 
      googleApiKey: 'test_key',
      ai: { 
        requestTimeoutMs: 30000, 
        maxRetries: 3,
        geminiModel: 'test-model',
        defaultPromptVersion: '1.0.0'
      } 
    } as any;
    await initializeAIConfig(mockConfig);
    initializeGemini(mockConfig);
  });

  it('integrates PerceptionResult through Decision and Confidence Engines', async () => {
    // 1. Arrange
    // Setup mock response for the Gemini adapter inside the vision provider
    (GeminiVisionAdapter as jest.Mock).mockImplementation(() => {
      return {
        initialize: jest.fn().mockResolvedValue(undefined),
        extractObservations: jest.fn().mockResolvedValue({
          issueType: 'POTHOLE',
          severity: 'HIGH',
          description: 'Large pothole',
          observations: ['Hole visible'],
          potentialHazards: ['Vehicle damage'],
          infrastructure: 'ROAD',
          inspectionPriority: 'HIGH',
          reasoningSummary: 'Test',
          limitations: []
        })
      };
    });

    const coordinator = await RuntimeFactory.create();

    const mockPerception: PerceptionResult = {
      detectedIssue: 'POTHOLE',
      severityEstimate: 'HIGH',
      visualObservations: ['Hole visible'],
      metadata: { 
        imageRef: 'test-image',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date().toISOString()
      }
    };

    // 2. Act
    const result = await coordinator.execute(mockPerception);

    // 3. Assert
    expect(result.status).toBe('COMPLETED');
    expect(result.decision).toBeDefined();
    expect(result.confidence).toBeDefined();
    
    // Check flow of data
    expect(result.decision?.issueClassification).toBe('POTHOLE');
    expect(result.decision?.priorityRecommendation).toBe('HIGH');
  });
});

