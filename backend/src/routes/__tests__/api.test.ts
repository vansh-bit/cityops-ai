import { analyzeHandler } from '../demo';
import { randomUUID } from 'crypto';

jest.mock('../../evidence/framework/EvidenceFramework');
jest.mock('../../evidence/providers/vision/VisionProvider', () => {
  return {
    VisionProvider: jest.fn().mockImplementation(() => {
      return {
        initialize: jest.fn().mockResolvedValue(undefined),
        collectEvidence: jest.fn().mockResolvedValue({
          status: 'VALID',
          evidence: {
            metadata: { source: 'VISION_ANALYSIS' },
            data: { issueType: 'Test', severity: 'Low', observations: [] }
          }
        })
      };
    })
  };
});
jest.mock('../../ai/factory/RuntimeFactory', () => {
  return {
    RuntimeFactory: {
      create: jest.fn().mockResolvedValue({
        execute: jest.fn().mockResolvedValue({
          correlationId: 'test-id',
          decision: { issueClassification: 'Test', priorityRecommendation: 'Low', departmentRecommendation: 'Test', reasoning: 'Test' },
          confidence: { confidenceValue: 100, confidenceLevel: 'HIGH', escalationRequired: false, evaluationSummary: 'Test' },
          evidence: [
            {
              source: 'evidence_collection_tool',
              data: {
                package: {
                  metadata: {
                    providerCount: 1,
                    collectionDurationMs: 100,
                    successfulProviders: 1,
                    failedProviders: 0
                  }
                }
              }
            }
          ]
        })
      })
    }
  };
});
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

describe('API Route Validation', () => {
  it('should return 400 INVALID_COORDINATES if latitude is malformed', async () => {
    const req = {
      file: { buffer: Buffer.from('test'), mimetype: 'image/jpeg' },
      body: { latitude: 'invalid_lat', longitude: '-74.0060', description: 'test' }
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await analyzeHandler(req as any, res as any, () => {});
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'INVALID_COORDINATES', message: 'Latitude and longitude must be valid numbers.' }
    });
  });

  it('should parse valid string coordinates successfully', async () => {
    const req = {
      file: { buffer: Buffer.from('test'), mimetype: 'image/jpeg' },
      body: { latitude: '40.7128', longitude: '-74.0060', description: 'test' }
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await analyzeHandler(req as any, res as any, () => {});
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true
    }));
    
    const payload = res.json.mock.calls[0][0];
    expect(payload.telemetry).toBeUndefined(); // Root telemetry should be removed
    expect(payload.evidencePackage).toBeDefined();
    expect(payload.evidencePackage.metadata.providerCount).toBe(1);
  });
});
