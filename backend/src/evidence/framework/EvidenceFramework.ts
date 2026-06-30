import { randomUUID } from 'crypto';
import { Evidence, EvidenceRequest, EvidenceResponse, EvidenceSource, EvidenceStatus } from '../contracts/evidenceContracts';
import { EvidenceValidator } from '../validation/EvidenceValidator';
import { EvidenceLogger } from '../logging/EvidenceLogger';
import { EvidenceMetrics } from '../metrics/EvidenceMetrics';
import { EvidenceProvider } from '../interfaces/evidenceInterfaces';

export class EvidenceFramework {
  
  private validator: EvidenceValidator;

  constructor() {
    this.validator = new EvidenceValidator();
  }

  /**
   * Orchestrates the execution of a single provider.
   * Ensures deterministic metadata, validation, metrics, and logging.
   */
  async executeProvider(provider: EvidenceProvider, request: EvidenceRequest, providerId: string): Promise<EvidenceResponse> {
    const startTime = Date.now();
    EvidenceLogger.logEvidenceCreationStarted(providerId, request.requestId);

    try {
      // Validate that the provider can handle this request
      if (!provider.validateRequest(request)) {
        EvidenceMetrics.recordValidationFailure();
        const errors = ['Provider cannot handle the given request parameters'];
        EvidenceLogger.logEvidenceValidationFailed(providerId, request.requestId, errors);
        
        return {
          requestId: request.requestId,
          source: request.source,
          status: EvidenceStatus.ERROR,
          evidence: null,
          errors
        };
      }

      // Collect evidence
      const response = await provider.collectEvidence(request);
      
      const durationMs = Date.now() - startTime;
      EvidenceMetrics.recordProviderLatency(durationMs);

      // Validation
      if (response.evidence) {
        // Enforce consistent metadata
        response.evidence.metadata.providerId = providerId;
        response.evidence.metadata.executionDurationMs = durationMs;

        const validationErrors = this.validator.getErrors(response.evidence);
        
        if (validationErrors.length > 0) {
          EvidenceMetrics.recordValidationFailure();
          EvidenceLogger.logEvidenceValidationFailed(providerId, request.requestId, validationErrors);
          
          return {
            requestId: request.requestId,
            source: request.source,
            status: EvidenceStatus.ERROR,
            evidence: null,
            errors: validationErrors
          };
        }
      } else if (response.status !== EvidenceStatus.ERROR) {
        // If there is no evidence and it's not marked as ERROR, this is an internal mismatch
        const errors = ['Provider returned no evidence but status is not ERROR'];
        EvidenceMetrics.recordValidationFailure();
        EvidenceLogger.logEvidenceValidationFailed(providerId, request.requestId, errors);
        return {
          requestId: request.requestId,
          source: request.source,
          status: EvidenceStatus.ERROR,
          evidence: null,
          errors
        };
      }

      if (response.status === EvidenceStatus.ERROR) {
        EvidenceMetrics.recordProviderFailure();
      } else {
        EvidenceMetrics.recordEvidenceCollected();
      }

      EvidenceLogger.logEvidenceCreationCompleted(providerId, request.requestId, durationMs, response.status);
      return response;

    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      EvidenceMetrics.recordProviderLatency(durationMs);
      EvidenceMetrics.recordProviderFailure();
      EvidenceLogger.logEvidenceProviderError(providerId, request.requestId, error.message);
      
      return {
        requestId: request.requestId,
        source: request.source,
        status: EvidenceStatus.ERROR,
        evidence: null,
        errors: [error.message]
      };
    }
  }

  /**
   * Helper to create a base evidence template to be filled by providers.
   */
  createBaseEvidence(source: EvidenceSource, providerId: string): Evidence {
    return {
      id: randomUUID(),
      status: EvidenceStatus.VALID,
      data: {},
      metadata: {
        providerId,
        source,
        timestamp: new Date().toISOString()
      }
    };
  }
}
