import { EvidenceCoordinator } from '../coordinator/EvidenceCoordinator';
import { EvidenceProvider } from '../../interfaces/evidenceInterfaces';
import { EvidenceRequest, EvidenceResponse, EvidenceSource, EvidenceStatus } from '../../contracts/evidenceContracts';

describe('EvidenceCoordinator', () => {
  it('collects and aggregates evidence successfully', async () => {
    const mockProvider: EvidenceProvider = {
      initialize: async () => {},
      validateRequest: (req) => true,
      collectEvidence: async (req) => ({ requestId: req.requestId, status: EvidenceStatus.VALID, evidence: { id: 'e1', metadata: { source: req.source } } } as any)
    };

    const coordinator = new EvidenceCoordinator([mockProvider]);

    const requests: EvidenceRequest[] = [
      { requestId: 'req-1', source: EvidenceSource.GOOGLE_MAPS, parameters: {} }
    ];

    const packageResult = await coordinator.collectEvidence(requests);

    expect(packageResult.status).toBe(EvidenceStatus.VALID);
    expect(packageResult.evidence.length).toBe(1);
    expect(packageResult.metadata.providersCompleted).toContain(EvidenceSource.GOOGLE_MAPS);
  });

  it('handles scheduler unexpected failure gracefully', async () => {
    const mockProvider: EvidenceProvider = {
      initialize: async () => {},
      validateRequest: () => true,
      collectEvidence: async () => { throw new Error('Uncaught Crash'); }
    };
    const coordinator = new EvidenceCoordinator([mockProvider]);

    // Mock scheduler to throw synchronously
    jest.spyOn((coordinator as any).scheduler, 'executeRequests').mockRejectedValue(new Error('Scheduler Crash'));

    const requests: EvidenceRequest[] = [
      { requestId: 'req-2', source: EvidenceSource.GOOGLE_MAPS, parameters: {} }
    ];

    const packageResult = await coordinator.collectEvidence(requests);

    expect(packageResult.status).toBe(EvidenceStatus.ERROR);
    expect(packageResult.errors).toContain('Orchestration failed unexpectedly: Scheduler Crash');
  });

  it('handles aggregation unexpected failure gracefully', async () => {
    const mockProvider: EvidenceProvider = {
      initialize: async () => {},
      validateRequest: () => true,
      collectEvidence: async (req) => ({ requestId: req.requestId, status: EvidenceStatus.VALID, evidence: null })
    };
    const coordinator = new EvidenceCoordinator([mockProvider]);

    // Mock aggregator to throw
    const { EvidenceAggregator } = require('../aggregation/EvidenceAggregator');
    jest.spyOn(EvidenceAggregator, 'aggregate').mockImplementation(() => {
      throw new Error('Aggregation Crash');
    });

    const requests: EvidenceRequest[] = [
      { requestId: 'req-3', source: EvidenceSource.GOOGLE_MAPS, parameters: {} }
    ];

    const packageResult = await coordinator.collectEvidence(requests);

    expect(packageResult.status).toBe(EvidenceStatus.ERROR);
    expect(packageResult.errors).toContain('Orchestration failed unexpectedly: Aggregation Crash');
    
    jest.restoreAllMocks();
  });
});
