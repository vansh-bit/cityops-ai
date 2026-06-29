import { randomUUID } from 'crypto';
import { EvidenceResponse, EvidenceStatus, Evidence } from '../../contracts/evidenceContracts';
import { EvidencePackage, EvidencePackageMetadata } from '../models/EvidencePackage';

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
    const evidenceList: Evidence[] = [];
    const errors: string[] = [];
    const completedProviders: string[] = [];
    const failedProviders: string[] = [];
    
    let validCount = 0;
    let errorCount = 0;

    for (const response of responses) {
      if (response.status === EvidenceStatus.VALID && response.evidence) {
        evidenceList.push(response.evidence);
        completedProviders.push(response.evidence.metadata.source);
        validCount++;
      } else {
        errorCount++;
        // If there's an error but we don't know the exact provider because it failed early,
        // the scheduler handles mapping, but here we just collect errors.
        if (response.errors) {
          errors.push(...response.errors);
        }
      }
    }

    // Determine overall status
    let overallStatus = EvidenceStatus.VALID;
    if (responses.length === 0) {
      overallStatus = EvidenceStatus.ERROR;
    } else if (errorCount === responses.length) {
      overallStatus = EvidenceStatus.ERROR;
    } else if (errorCount > 0 && validCount > 0) {
      overallStatus = EvidenceStatus.PARTIAL;
    }

    const endTimeMs = Date.now();
    const durationMs = endTimeMs - startTimeMs;

    // Identify failed providers based on requested vs completed
    for (const requested of requestedProviders) {
      if (!completedProviders.includes(requested)) {
        failedProviders.push(requested);
      }
    }

    const metadata: EvidencePackageMetadata = {
      orchestrationStartTime: new Date(startTimeMs).toISOString(),
      orchestrationEndTime: new Date(endTimeMs).toISOString(),
      durationMs,
      providersRequested: requestedProviders,
      providersCompleted: completedProviders,
      providersFailed: failedProviders
    };

    return {
      packageId: randomUUID(),
      requestId,
      status: overallStatus,
      evidence: evidenceList,
      metadata,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}
