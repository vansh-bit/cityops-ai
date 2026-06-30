import { EvidenceToolAdapter } from '../runtime/EvidenceToolAdapter';
import { EvidenceCoordinator } from '../coordinator/EvidenceCoordinator';
import { EvidenceProvider } from '../../interfaces/evidenceInterfaces';
import { EvidenceStatus } from '../../contracts/evidenceContracts';

describe('EvidenceToolAdapter', () => {
  it('translates runtime tool requests to orchestration and returns correct raw tool response', async () => {
    const mockProvider: EvidenceProvider = {
      initialize: async () => {},
      validateRequest: () => true,
      collectEvidence: async (req) => ({ requestId: req.requestId, source: req.source, status: EvidenceStatus.VALID, evidence: { id: 'e1', metadata: { source: req.source }, data: { location: {}, municipality: {}, infrastructure: {} } } } as any)
    };

    const coordinator = new EvidenceCoordinator([mockProvider]);
    const adapter = new EvidenceToolAdapter(coordinator);

    const inputs = { providers: ['GOOGLE_MAPS', 'MUNICIPAL'] };

    const response = await adapter.execute(inputs);

    expect(response.data).toBeDefined();
    expect((response.data?.package as any).overallStatus).toBe(EvidenceStatus.VALID);
  });

  it('handles runtime cancellation or unexpected coordinator error gracefully by throwing', async () => {
    const coordinator = new EvidenceCoordinator([]);
    // Force coordinator to reject simulating a cancelled execution or critical failure
    jest.spyOn(coordinator, 'collectEvidence').mockRejectedValue(new Error('Execution Cancelled'));
    
    const adapter = new EvidenceToolAdapter(coordinator);

    const inputs = { providers: ['GOOGLE_MAPS'] };

    await expect(adapter.execute(inputs)).rejects.toThrow('Execution Cancelled');
  });
});
