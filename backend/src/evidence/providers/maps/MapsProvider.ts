import { EvidenceProvider } from '../../interfaces/evidenceInterfaces';
import { EvidenceRequest, EvidenceResponse, EvidenceSource, EvidenceStatus } from '../../contracts/evidenceContracts';
import { GoogleMapsAdapter } from '../../adapters/GoogleMapsAdapter';
import { MapsNormalizer } from '../../normalization/MapsNormalizer';
import { EvidenceFramework } from '../../framework/EvidenceFramework';

export class MapsProvider implements EvidenceProvider {
  private adapter: GoogleMapsAdapter;
  private normalizer: MapsNormalizer;
  private framework: EvidenceFramework;

  constructor(framework: EvidenceFramework) {
    this.adapter = new GoogleMapsAdapter();
    this.normalizer = new MapsNormalizer();
    this.framework = framework;
  }

  async initialize(): Promise<void> {
    await this.adapter.initialize();
  }

  validateRequest(request: EvidenceRequest): boolean {
    if (request.source !== EvidenceSource.GOOGLE_MAPS) return false;
    
    const { lat, lng } = request.parameters;
    return typeof lat === 'number' && typeof lng === 'number';
  }

  async collectEvidence(request: EvidenceRequest): Promise<EvidenceResponse> {
    const { lat, lng } = request.parameters;

    try {
      const rawData = await this.adapter.reverseGeocode(lat, lng);
      const normalizedData = this.normalizer.normalize(rawData);
      
      const evidence = this.framework.createBaseEvidence(EvidenceSource.GOOGLE_MAPS, 'google_maps_provider');
      if (this.adapter.stubMode) {
        evidence.metadata.providerVersion = 'STUB_MODE';
      }
      evidence.data = normalizedData;

      return {
        requestId: request.requestId,
        status: EvidenceStatus.VALID,
        evidence
      };
    } catch (error: any) {
      return {
        requestId: request.requestId,
        status: EvidenceStatus.ERROR,
        evidence: null,
        errors: [error.message]
      };
    }
  }
}
