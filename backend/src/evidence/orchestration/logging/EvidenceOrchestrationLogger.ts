import logger from '../../../utils/logger';

export class EvidenceOrchestrationLogger {
  static logProviderExecutionStarted(requestId: string, providerName: string, orderIndex: number) {
    logger.info(`Provider execution started`, {
      event: 'orchestration_provider_started',
      requestId,
      providerName,
      orderIndex
    });
  }

  static logProviderExecutionCompleted(requestId: string, providerName: string, durationMs: number) {
    logger.info(`Provider execution completed`, {
      event: 'orchestration_provider_completed',
      requestId,
      providerName,
      durationMs
    });
  }

  static logAggregationEvent(requestId: string, successCount: number, errorCount: number) {
    logger.info(`Evidence aggregation performed`, {
      event: 'orchestration_aggregation',
      requestId,
      successCount,
      errorCount
    });
  }

  static logFailure(requestId: string, component: string, message: string) {
    logger.error(`Orchestration failure in ${component}`, {
      event: 'orchestration_failure',
      requestId,
      component,
      errorMessage: message
    });
  }

  static logWarning(requestId: string, message: string) {
    logger.warn(`Orchestration warning`, {
      event: 'orchestration_warning',
      requestId,
      warningMessage: message
    });
  }

  static logCompletion(requestId: string, status: string, durationMs: number) {
    logger.info(`Evidence orchestration completed`, {
      event: 'orchestration_completed',
      requestId,
      status,
      durationMs
    });
  }
}
