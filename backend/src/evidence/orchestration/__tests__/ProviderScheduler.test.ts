import { ProviderScheduler } from '../scheduler/ProviderScheduler';
import { EvidenceProvider } from '../../interfaces/evidenceInterfaces';
import { EvidenceRequest, EvidenceResponse, EvidenceSource, EvidenceStatus } from '../../contracts/evidenceContracts';

describe('ProviderScheduler', () => {
  it('deduplicates requests and executes valid providers', async () => {
    const mockProvider: EvidenceProvider = {
      initialize: async () => {},
      validateRequest: (req) => req.source === EvidenceSource.GOOGLE_MAPS,
      collectEvidence: async (req) => ({ requestId: req.requestId, status: EvidenceStatus.VALID, evidence: null })
    };

    const scheduler = new ProviderScheduler([mockProvider]);

    const requests: EvidenceRequest[] = [
      { requestId: 'r1', source: EvidenceSource.GOOGLE_MAPS, parameters: {} },
      { requestId: 'r2', source: EvidenceSource.GOOGLE_MAPS, parameters: {} }, // duplicate source
    ];

    const responses = await scheduler.executeRequests(requests);

    expect(responses.length).toBe(1);
    expect(responses[0].status).toBe(EvidenceStatus.VALID);
  });

  it('returns ERROR response for unknown provider source', async () => {
    const scheduler = new ProviderScheduler([]);

    const requests: EvidenceRequest[] = [
      { requestId: 'r1', source: EvidenceSource.UNKNOWN, parameters: {} }
    ];

    const responses = await scheduler.executeRequests(requests);

    expect(responses.length).toBe(1);
    expect(responses[0].status).toBe(EvidenceStatus.ERROR);
    expect(responses[0].errors![0]).toContain('No valid provider found');
  });
});
