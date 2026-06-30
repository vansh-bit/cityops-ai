import { EvidenceFramework } from '../framework/EvidenceFramework';
import { EvidenceProvider } from '../interfaces/evidenceInterfaces';
import { EvidenceRequest, EvidenceSource, EvidenceStatus, EvidenceResponse } from '../contracts/evidenceContracts';
import { EvidenceMetrics } from '../metrics/EvidenceMetrics';
import { EvidenceLogger } from '../logging/EvidenceLogger';
import { randomUUID } from 'crypto';

jest.mock('../logging/EvidenceLogger');

describe('EvidenceFramework', () => {
  let framework: EvidenceFramework;
  let mockProvider: jest.Mocked<EvidenceProvider>;

  beforeEach(() => {
    EvidenceMetrics.reset();
    framework = new EvidenceFramework();
    
    mockProvider = {
      initialize: jest.fn().mockResolvedValue(undefined),
      validateRequest: jest.fn().mockReturnValue(true),
      collectEvidence: jest.fn()
    };
  });

  const getValidRequest = (): EvidenceRequest => ({
    requestId: 'req-1',
    source: EvidenceSource.MUNICIPAL,
    parameters: {}
  });

  it('fails if provider validation fails', async () => {
    mockProvider.validateRequest.mockReturnValue(false);
    
    const response = await framework.executeProvider(mockProvider, getValidRequest(), 'prov-1');
    
    expect(response.status).toBe(EvidenceStatus.ERROR);
    expect(response.evidence).toBeNull();
    expect(response.errors).toContain('Provider cannot handle the given request parameters');
    expect(EvidenceMetrics.getMetricsSnapshot().validationFailures).toBe(1);
  });

  it('executes successfully and populates metadata', async () => {
    mockProvider.collectEvidence.mockResolvedValue({
      requestId: 'req-1',
      source: EvidenceSource.VISION_ANALYSIS,
      status: EvidenceStatus.VALID,
      evidence: {
        id: randomUUID(),
        status: EvidenceStatus.VALID,
        data: { a: 1 },
        metadata: {
          providerId: '', // Should be overwritten by framework
          source: EvidenceSource.MUNICIPAL,
          timestamp: new Date().toISOString()
        }
      }
    });

    const response = await framework.executeProvider(mockProvider, getValidRequest(), 'prov-1');
    
    expect(response.status).toBe(EvidenceStatus.VALID);
    expect(response.evidence?.metadata.providerId).toBe('prov-1');
    expect(response.evidence?.metadata.executionDurationMs).toBeDefined();
    
    const metrics = EvidenceMetrics.getMetricsSnapshot();
    expect(metrics.totalCollected).toBe(1);
    expect(metrics.averageLatencyMs).toBeGreaterThanOrEqual(0);
  });

  it('fails if collected evidence is malformed', async () => {
    mockProvider.collectEvidence.mockResolvedValue({
      requestId: 'req-1',
      source: EvidenceSource.VISION_ANALYSIS,
      status: EvidenceStatus.VALID,
      evidence: {
        id: randomUUID(),
        status: EvidenceStatus.VALID,
        data: {}, // Invalid data for VALID status
        metadata: {
          providerId: 'prov-1',
          source: EvidenceSource.MUNICIPAL,
          timestamp: new Date().toISOString()
        }
      }
    });

    const response = await framework.executeProvider(mockProvider, getValidRequest(), 'prov-1');
    
    expect(response.status).toBe(EvidenceStatus.ERROR);
    expect(response.errors).toBeDefined();
    expect(EvidenceMetrics.getMetricsSnapshot().validationFailures).toBe(1);
  });

  it('fails if provider throws an error', async () => {
    mockProvider.collectEvidence.mockRejectedValue(new Error('Network failure'));
    
    const response = await framework.executeProvider(mockProvider, getValidRequest(), 'prov-1');
    
    expect(response.status).toBe(EvidenceStatus.ERROR);
    expect(response.errors).toContain('Network failure');
    expect(EvidenceMetrics.getMetricsSnapshot().providerFailures).toBe(1);
    expect(EvidenceLogger.logEvidenceProviderError).toHaveBeenCalledWith('prov-1', 'req-1', 'Network failure');
  });
});
