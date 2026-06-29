import { EvidenceProvider } from '../../interfaces/evidenceInterfaces';
import { EvidenceRequest, EvidenceResponse, EvidenceSource, EvidenceStatus } from '../../contracts/evidenceContracts';
import { MunicipalDataAdapter } from '../../adapters/MunicipalDataAdapter';
import { MunicipalNormalizer } from '../../normalization/MunicipalNormalizer';
import { EvidenceFramework } from '../../framework/EvidenceFramework';

export class MunicipalProvider implements EvidenceProvider {
  private adapter: MunicipalDataAdapter;
  private normalizer: MunicipalNormalizer;
  private framework: EvidenceFramework;

  constructor(framework: EvidenceFramework) {
    this.adapter = new MunicipalDataAdapter();
    this.normalizer = new MunicipalNormalizer();
    this.framework = framework;
  }

  async initialize(): Promise<void> {
    await this.adapter.initialize();
  }

  validateRequest(request: EvidenceRequest): boolean {
    if (request.source !== EvidenceSource.MUNICIPAL) return false;
    
    const { locationQuery } = request.parameters;
    return typeof locationQuery === 'string' && locationQuery.trim().length > 0;
  }

  async collectEvidence(request: EvidenceRequest): Promise<EvidenceResponse> {
    const { locationQuery } = request.parameters;

    try {
      const rawData = await this.adapter.fetchAssetContext(locationQuery);
      const normalizedData = this.normalizer.normalize(rawData);
      
      const evidence = this.framework.createBaseEvidence(EvidenceSource.MUNICIPAL, 'municipal_data_provider');
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
