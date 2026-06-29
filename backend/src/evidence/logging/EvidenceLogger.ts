import logger from '../../utils/logger';

export class EvidenceLogger {
  
  static logEvidenceCreationStarted(providerId: string, requestId: string): void {
    logger.info(`Evidence collection started`, {
      event: 'evidence_collection_started',
      providerId,
      requestId,
    });
  }

  static logEvidenceCreationCompleted(providerId: string, requestId: string, durationMs: number, status: string): void {
    logger.info(`Evidence collection completed`, {
      event: 'evidence_collection_completed',
      providerId,
      requestId,
      durationMs,
      status
    });
  }

  static logEvidenceValidationFailed(providerId: string, requestId: string, errors: string[]): void {
    logger.warn(`Evidence validation failed`, {
      event: 'evidence_validation_failed',
      providerId,
      requestId,
      validationErrors: errors
    });
  }

  static logEvidenceProviderError(providerId: string, requestId: string, errorMessage: string): void {
    logger.error(`Evidence provider error: ${errorMessage}`, {
      event: 'evidence_provider_error',
      providerId,
      requestId,
    });
  }
}
