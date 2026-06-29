import { EvidenceAggregator } from '../aggregation/EvidenceAggregator';
import { EvidenceResponse, EvidenceStatus, Evidence, EvidenceSource } from '../../contracts/evidenceContracts';

describe('EvidenceAggregator', () => {
  it('aggregates multiple VALID responses into a VALID package', () => {
    const responses: EvidenceResponse[] = [
      {
        requestId: 'req-1',
        status: EvidenceStatus.VALID,
        evidence: { metadata: { source: EvidenceSource.GOOGLE_MAPS } } as Evidence
      },
      {
        requestId: 'req-1',
        status: EvidenceStatus.VALID,
        evidence: { metadata: { source: EvidenceSource.MUNICIPAL } } as Evidence
      }
    ];

    const packageResult = EvidenceAggregator.aggregate('req-1', responses, [EvidenceSource.GOOGLE_MAPS, EvidenceSource.MUNICIPAL], Date.now());

    expect(packageResult.status).toBe(EvidenceStatus.VALID);
    expect(packageResult.evidence.length).toBe(2);
    expect(packageResult.metadata.providersFailed.length).toBe(0);
  });

  it('aggregates mixed responses into a PARTIAL package', () => {
    const responses: EvidenceResponse[] = [
      {
        requestId: 'req-1',
        status: EvidenceStatus.VALID,
        evidence: { metadata: { source: EvidenceSource.GOOGLE_MAPS } } as Evidence
      },
      {
        requestId: 'req-1',
        status: EvidenceStatus.ERROR,
        evidence: null,
        errors: ['Failed to fetch']
      }
    ];

    const packageResult = EvidenceAggregator.aggregate('req-1', responses, [EvidenceSource.GOOGLE_MAPS, EvidenceSource.MUNICIPAL], Date.now());

    expect(packageResult.status).toBe(EvidenceStatus.PARTIAL);
    expect(packageResult.evidence.length).toBe(1);
    expect(packageResult.errors).toContain('Failed to fetch');
    expect(packageResult.metadata.providersFailed).toContain(EvidenceSource.MUNICIPAL);
  });

  it('aggregates all ERROR responses into an ERROR package', () => {
    const responses: EvidenceResponse[] = [
      {
        requestId: 'req-1',
        status: EvidenceStatus.ERROR,
        evidence: null
      }
    ];

    const packageResult = EvidenceAggregator.aggregate('req-1', responses, [EvidenceSource.GOOGLE_MAPS], Date.now());

    expect(packageResult.status).toBe(EvidenceStatus.ERROR);
    expect(packageResult.metadata.providersFailed).toContain(EvidenceSource.GOOGLE_MAPS);
  });

  it('handles invalid normalized evidence gracefully', () => {
    const responses: EvidenceResponse[] = [
      {
        requestId: 'req-1',
        status: EvidenceStatus.VALID,
        evidence: { id: 'invalid', metadata: { source: EvidenceSource.GOOGLE_MAPS }, data: undefined } as any // Missing data, simulating bad normalize
      }
    ];

    const packageResult = EvidenceAggregator.aggregate('req-1', responses, [EvidenceSource.GOOGLE_MAPS], Date.now());
    
    // Aggregator just aggregates what it's given, it shouldn't crash on invalid evidence payloads.
    expect(packageResult.status).toBe(EvidenceStatus.VALID);
    expect(packageResult.evidence.length).toBe(1);
    expect(packageResult.evidence[0].id).toBe('invalid');
  });
});
