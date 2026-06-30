import { analyzeHandler } from '../demo';
import { VisionProvider } from '../../evidence/providers/vision/VisionProvider';
import { randomUUID } from 'crypto';

// Mock the VisionProvider entirely for API tests
jest.mock('../../evidence/providers/vision/VisionProvider');
import { initializeAIConfig } from '../../ai/config/aiConfig';
import { initializeGemini } from '../../config/gemini';

jest.mock('../../persistence/PersistenceCoordinator', () => {
  return {
    PersistenceCoordinator: jest.fn().mockImplementation(() => {
      return {
        persist: jest.fn().mockResolvedValue({
          success: true,
          trackingId: 'CITYOPS-TEST-0001',
          storageObjectPath: 'gs://cityops-test/reports/CITYOPS-TEST-0001/original.jpg'
        })
      };
    })
  };
});

jest.mock('../../ai/services/AIService', () => {
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

describe('Demo API Route Tests', () => {
  let mockCollectEvidence: jest.Mock;
  let mockReq: any;
  let mockRes: any;
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

  beforeEach(() => {
    mockCollectEvidence = jest.fn();
    (VisionProvider as jest.Mock).mockImplementation(() => {
      return {
        initialize: jest.fn().mockResolvedValue(undefined),
        collectEvidence: mockCollectEvidence
      };
    });

    mockReq = {
      body: { description: 'test', latitude: 40, longitude: -74 },
      file: { buffer: Buffer.from('test'), mimetype: 'image/jpeg' }
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('rejects missing image', async () => {
    mockReq.file = undefined;
    await analyzeHandler(mockReq, mockRes, () => {});
    
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.objectContaining({ code: 'INVALID_REQUEST' })
    }));
  });

  it('rejects invalid MIME type', async () => {
    mockReq.file.mimetype = 'text/plain';
    await analyzeHandler(mockReq, mockRes, () => {});
    
    expect(mockRes.status).toHaveBeenCalledWith(415);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ code: 'UNSUPPORTED_MEDIA_TYPE' })
    }));
  });

  it('handles safety refusal (CONTENT_NOT_SUPPORTED)', async () => {
    mockCollectEvidence.mockResolvedValue({
      status: 'ERROR',
      errors: ['CONTENT_NOT_SUPPORTED: Blocked']
    });

    await analyzeHandler(mockReq, mockRes, () => {});
    
    expect(mockRes.status).toHaveBeenCalledWith(422);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ code: 'CONTENT_NOT_SUPPORTED' })
    }));
  });

  it('handles timeouts (GATEWAY_TIMEOUT)', async () => {
    mockCollectEvidence.mockResolvedValue({
      status: 'ERROR',
      errors: ['TIMEOUT: Gemini request exceeded 30 seconds']
    });

    await analyzeHandler(mockReq, mockRes, () => {});
    
    expect(mockRes.status).toHaveBeenCalledWith(504);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ code: 'GATEWAY_TIMEOUT' })
    }));
  });

  it('returns correctly formatted API response (API_CONTRACT)', async () => {
    mockCollectEvidence.mockResolvedValue({
      status: 'VALID',
      evidence: {
        metadata: { source: 'VISION_ANALYSIS' },
        data: {
          issueType: 'POTHOLE',
          severity: 'HIGH'
        }
      }
    });

    await analyzeHandler(mockReq, mockRes, () => {});
    
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      decision: expect.anything(),
      confidence: expect.anything(),
      visionResult: expect.objectContaining({ issueType: 'POTHOLE' })
    }));
  });
});
