import { EvidenceRequest, EvidenceResponse, EvidenceStatus } from '../../contracts/evidenceContracts';
import { ProviderScheduler } from '../scheduler/ProviderScheduler';
import { EvidenceAggregator } from '../aggregation/EvidenceAggregator';
import { EvidencePackage } from '../models/EvidencePackage';
import { EvidenceOrchestrationLogger } from '../logging/EvidenceOrchestrationLogger';
import { EvidenceOrchestrationMetrics } from '../logging/EvidenceOrchestrationMetrics';
import { EvidenceProvider } from '../../interfaces/evidenceInterfaces';

export class EvidenceCoordinator {
  private scheduler: ProviderScheduler;

  constructor(providers: EvidenceProvider[]) {
    this.scheduler = new ProviderScheduler(providers);
  }

  /**
   * Orchestrates the collection of evidence across multiple providers.
   * Handles scheduling, execution, and aggregation into a unified EvidencePackage.
   */
  async collectEvidence(requests: EvidenceRequest[]): Promise<EvidencePackage> {
    const startTimeMs = Date.now();
    const requestId = requests.length > 0 ? requests[0].requestId : 'unknown-request';
    const metrics = new EvidenceOrchestrationMetrics();
    metrics.startOrchestration();
    
    // Log start (we don't have a specific Orchestration start in logger but it was logger.info before)
    // Actually, I didn't add logOrchestrationStarted to the EvidenceOrchestrationLogger. I'll just use the completion one at the end, or I can add it, but there's no strict requirement for 'started', just 'completion status'. I will keep the raw logger if needed or add it. Let's just keep the EvidenceOrchestrationLogger for everything.
    
    const requestedProviders = requests.map(r => r.source);
    
    let responses: EvidenceResponse[] = [];
    let evidencePackage: EvidencePackage;
    
    try {
      // Execute scheduled requests concurrently
      responses = await this.scheduler.executeRequests(requests, metrics);

      // Aggregate into a single package
      evidencePackage = EvidenceAggregator.aggregate(requestId, responses, requestedProviders, startTimeMs);
    } catch (error) {
      EvidenceOrchestrationLogger.logFailure(requestId, 'EvidenceCoordinator', error instanceof Error ? error.message : String(error));
      evidencePackage = {
        packageId: 'failed-pkg-' + Date.now(),
        requestId,
        status: EvidenceStatus.ERROR,
        evidence: [],
        errors: ['Orchestration failed unexpectedly: ' + (error instanceof Error ? error.message : String(error))],
        metadata: {
          orchestrationStartTime: new Date(startTimeMs).toISOString(),
          orchestrationEndTime: new Date().toISOString(),
          durationMs: Date.now() - startTimeMs,
          providersRequested: requestedProviders,
          providersCompleted: [],
          providersFailed: requestedProviders
        }
      };
    }

    // Provide the generated metrics to the package or log them
    const metricsPayload = metrics.generateMetricsPayload();
    evidencePackage.metadata.metrics = metricsPayload;
    
    EvidenceOrchestrationLogger.logAggregationEvent(requestId, metricsPayload.aggregationStatistics.totalProvidersCompleted, metricsPayload.aggregationStatistics.totalProvidersFailed);
    EvidenceOrchestrationLogger.logCompletion(requestId, evidencePackage.status, evidencePackage.metadata.durationMs);

    return evidencePackage;
  }
}
