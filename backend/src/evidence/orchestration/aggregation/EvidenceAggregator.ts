import { EvidenceResponse, EvidenceStatus, EvidenceSource } from '../../contracts/evidenceContracts';
import { EvidencePackage, ProviderStatus, EvidenceMetadata } from '../models/EvidencePackage';

export class EvidenceAggregator {
  /**
   * Merges multiple EvidenceResponses into a single unified EvidencePackage.
   */
  static aggregate(
    requestId: string,
    responses: EvidenceResponse[],
    requestedProviders: string[],
    startTimeMs: number
  ): EvidencePackage {
    const providerStatuses: ProviderStatus[] = [];
    let validCount = 0;
    let errorCount = 0;
    
    let locationEvidence = undefined;
    let municipalityEvidence = undefined;
    let infrastructureEvidence = undefined;
    const limitations: string[] = [];

    for (const response of responses) {
      const isSuccess = response.status === EvidenceStatus.VALID || response.status === EvidenceStatus.PARTIAL;
      
      const durationMs = response.evidence?.metadata?.executionDurationMs || 0;
      
      let providerName = response.source as string;
      if (response.evidence) {
        providerName = response.evidence.metadata.source;
      }

      providerStatuses.push({
        provider: providerName,
        status: response.status === EvidenceStatus.VALID ? 'VALID' : (response.status === EvidenceStatus.PARTIAL ? 'PARTIAL' : 'ERROR'),
        durationMs,
        error: response.errors ? response.errors.join(', ') : undefined
      });

      if (isSuccess && response.evidence) {
        validCount++;
        
        // Extract data based on source
        if (response.evidence.metadata.source === EvidenceSource.GOOGLE_MAPS) {
          locationEvidence = response.evidence.data.location;
          municipalityEvidence = response.evidence.data.municipality;
          infrastructureEvidence = response.evidence.data.infrastructure;
          if (response.evidence.data.limitations) {
            limitations.push(...response.evidence.data.limitations);
          }
        }
        
        // If vision is also passed through here, we could extract vision limitations too
        if (response.evidence.data.limitations && response.evidence.metadata.source !== EvidenceSource.GOOGLE_MAPS) {
          limitations.push(...response.evidence.data.limitations);
        }
      } else {
        errorCount++;
        if (response.errors) {
          limitations.push(...response.errors);
        }
      }
    }

    // Determine overall status
    let overallStatus = EvidenceStatus.VALID;
    if (responses.length === 0 || errorCount === responses.length) {
      overallStatus = EvidenceStatus.ERROR;
    } else if (errorCount > 0) {
      overallStatus = EvidenceStatus.PARTIAL;
    }

    const endTimeMs = Date.now();
    const durationMs = endTimeMs - startTimeMs;

    const metadata: EvidenceMetadata = {
      collectionDurationMs: durationMs,
      providerCount: responses.length,
      successfulProviders: validCount,
      failedProviders: errorCount
    };

    return {
      requestId,
      collectedAt: new Date(endTimeMs).toISOString(),
      overallStatus,
      providers: providerStatuses,
      location: locationEvidence,
      municipality: municipalityEvidence,
      infrastructure: infrastructureEvidence,
      metadata,
      limitations
    };
  }
}
