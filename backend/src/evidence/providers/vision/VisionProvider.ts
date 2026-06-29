import { EvidenceProvider } from '../../interfaces/evidenceInterfaces';
import { EvidenceRequest, EvidenceResponse, EvidenceSource, EvidenceStatus } from '../../contracts/evidenceContracts';
import { GeminiVisionAdapter } from '../../adapters/GeminiVisionAdapter';
import { EvidenceFramework } from '../../framework/EvidenceFramework';

export class VisionProvider implements EvidenceProvider {
  private adapter: GeminiVisionAdapter;
  private framework: EvidenceFramework;

  constructor(framework: EvidenceFramework) {
    this.adapter = new GeminiVisionAdapter();
    this.framework = framework;
  }

  async initialize(): Promise<void> {
    await this.adapter.initialize();
  }

  validateRequest(request: EvidenceRequest): boolean {
    if (request.source !== EvidenceSource.VISION_ANALYSIS) return false;
    
    // In Phase 5A, we expect imageBuffer and mimeType, or imageUrl for stub mode
    const { imageBuffer, mimeType, imageUrl } = request.parameters;
    
    if (this.adapter.stubMode && imageUrl) return true;
    
    return Buffer.isBuffer(imageBuffer) && typeof mimeType === 'string';
  }

  async collectEvidence(request: EvidenceRequest): Promise<EvidenceResponse> {
    const { imageBuffer, mimeType, imageUrl } = request.parameters;

    try {
      let visionResult;
      
      if (this.adapter.stubMode && !imageBuffer) {
        // Fallback to old behavior in STUB_MODE
        visionResult = await this.adapter.extractObservations(Buffer.from(''), 'image/jpeg');
      } else {
        visionResult = await this.adapter.extractObservations(imageBuffer, mimeType);
      }
      
      const evidence = this.framework.createBaseEvidence(EvidenceSource.VISION_ANALYSIS, 'gemini_vision_provider');
      if (this.adapter.stubMode) {
        evidence.metadata.providerVersion = 'STUB_MODE';
      }
      // The schema is already validated and enforced by Gemini 2.5 structured output.
      evidence.data = visionResult;

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
