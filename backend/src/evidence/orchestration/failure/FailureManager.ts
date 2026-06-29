import { EvidenceResponse, EvidenceStatus } from '../../contracts/evidenceContracts';
import logger from '../../../utils/logger';

export class FailureManager {
  /**
   * Executes a provider collection promise with a hard timeout.
   * Ensures that any unhandled exception or timeout resolves deterministically
   * to an EvidenceResponse with status ERROR, preventing runtime crashes.
   */
  static async executeWithTimeout(
    requestId: string,
    providerName: string,
    providerPromise: Promise<EvidenceResponse>,
    timeoutMs: number
  ): Promise<EvidenceResponse> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        logger.warn(`Provider timeout exceeded`, {
          event: 'orchestration_provider_timeout',
          requestId,
          providerName,
          timeoutMs
        });
        resolve({
          requestId,
          status: EvidenceStatus.ERROR,
          evidence: null,
          errors: [`Provider ${providerName} timed out after ${timeoutMs}ms`]
        });
      }, timeoutMs);

      providerPromise
        .then((response) => {
          clearTimeout(timeoutId);
          resolve(response);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          logger.error(`Provider threw unhandled exception`, {
            event: 'orchestration_provider_exception',
            requestId,
            providerName,
            errorMessage: error.message || String(error)
          });
          resolve({
            requestId,
            status: EvidenceStatus.ERROR,
            evidence: null,
            errors: [`Provider ${providerName} threw unhandled exception: ${error.message || String(error)}`]
          });
        });
    });
  }
}
