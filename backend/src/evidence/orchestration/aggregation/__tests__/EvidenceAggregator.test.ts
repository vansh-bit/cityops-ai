import { EvidenceAggregator } from '../EvidenceAggregator';
import { EvidenceResponse, EvidenceStatus, EvidenceSource } from '../../../contracts/evidenceContracts';

describe('EvidenceAggregator', () => {
  const startTime = Date.now() - 1000;
  
  it('should return ERROR status if all providers fail', () => {
    const responses: EvidenceResponse[] = [
      { requestId: 'req1', source: EvidenceSource.GOOGLE_MAPS, status: EvidenceStatus.ERROR, evidence: null, errors: ['MAPS Error'] }
    ];
    
    const pkg = EvidenceAggregator.aggregate('req1', responses, ['GOOGLE_MAPS'], startTime);
    expect(pkg.overallStatus).toBe(EvidenceStatus.ERROR);
    expect(pkg.providers[0].status).toBe('ERROR');
    expect(pkg.limitations).toContain('MAPS Error');
  });

  it('should return PARTIAL status if some providers fail', () => {
    const responses: EvidenceResponse[] = [
      { 
        requestId: 'req1', 
        source: EvidenceSource.GOOGLE_MAPS,
        status: EvidenceStatus.VALID, 
        evidence: {
          id: '123',
          metadata: {
            providerId: 'google-maps',
            source: EvidenceSource.GOOGLE_MAPS,
            timestamp: new Date().toISOString(),
            executionDurationMs: 500
          },
          status: EvidenceStatus.VALID,
          data: {
            location: { latitude: 40, longitude: -74, formattedAddress: 'Valid Address', locality: '', city: '', district: '', state: '', country: '', postalCode: '' },
            municipality: { municipalityName: 'Valid City', jurisdiction: '', administrativeArea: '', responsibleAuthority: '' },
            infrastructure: { roadType: '', nearbyLandmarks: [], nearbyPublicInfrastructure: [], accessibility: '' }
          }
        }
      },
      { requestId: 'req1', source: EvidenceSource.VISION_ANALYSIS, status: EvidenceStatus.ERROR, evidence: null, errors: ['VISION Error'] }
    ];
    
    const pkg = EvidenceAggregator.aggregate('req1', responses, ['GOOGLE_MAPS', 'VISION_ANALYSIS'], startTime);
    expect(pkg.overallStatus).toBe(EvidenceStatus.PARTIAL);
    expect(pkg.metadata.successfulProviders).toBe(1);
    expect(pkg.metadata.failedProviders).toBe(1);
    expect(pkg.location?.formattedAddress).toBe('Valid Address');
    expect(pkg.municipality?.municipalityName).toBe('Valid City');
    expect(pkg.limitations).toContain('VISION Error');
  });

  it('should return VALID status if all providers succeed', () => {
    const responses: EvidenceResponse[] = [
      { 
        requestId: 'req1', 
        source: EvidenceSource.GOOGLE_MAPS,
        status: EvidenceStatus.VALID, 
        evidence: {
          id: '123',
          metadata: {
            providerId: 'google-maps',
            source: EvidenceSource.GOOGLE_MAPS,
            timestamp: new Date().toISOString(),
            executionDurationMs: 500
          },
          status: EvidenceStatus.VALID,
          data: {
            location: { latitude: 40, longitude: -74, formattedAddress: 'Valid Address', locality: '', city: '', district: '', state: '', country: '', postalCode: '' },
            municipality: { municipalityName: 'Valid City', jurisdiction: '', administrativeArea: '', responsibleAuthority: '' },
            infrastructure: { roadType: '', nearbyLandmarks: [], nearbyPublicInfrastructure: [], accessibility: '' }
          }
        }
      }
    ];
    
    const pkg = EvidenceAggregator.aggregate('req1', responses, ['GOOGLE_MAPS'], startTime);
    expect(pkg.overallStatus).toBe(EvidenceStatus.VALID);
    expect(pkg.metadata.successfulProviders).toBe(1);
    expect(pkg.metadata.failedProviders).toBe(0);
    expect(pkg.location?.formattedAddress).toBe('Valid Address');
  });
});
