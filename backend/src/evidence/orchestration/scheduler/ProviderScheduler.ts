import { EvidenceProvider } from '../../interfaces/evidenceInterfaces';
import { EvidenceRequest, EvidenceResponse, EvidenceStatus } from '../../contracts/evidenceContracts';
import { FailureManager } from '../failure/FailureManager';
import { EvidenceOrchestrationLogger } from '../logging/EvidenceOrchestrationLogger';
import { EvidenceOrchestrationMetrics } from '../logging/EvidenceOrchestrationMetrics';

export class ProviderScheduler {
  private providers: EvidenceProvider[];

  constructor(providers: EvidenceProvider[]) {
    this.providers = providers;
  }

  /**
   * Executes a list of evidence requests across the registered providers.
   * Handles deduplication of requests by source and enforces timeouts.
   */
  async executeRequests(requests: EvidenceRequest[], metrics?: EvidenceOrchestrationMetrics): Promise<EvidenceResponse[]> {
    // Deduplicate requests by source to prevent duplicate execution
    const uniqueRequests = new Map<string, EvidenceRequest>();
    for (const req of requests) {
      if (!uniqueRequests.has(req.source)) {
        uniqueRequests.set(req.source, req);
      }
    }

    const executionPromises: Promise<EvidenceResponse>[] = [];
    let orderIndex = 0;

    for (const request of uniqueRequests.values()) {
      // Find the appropriate provider for this request
      const provider = this.providers.find(p => p.validateRequest(request));
      
      if (!provider) {
        EvidenceOrchestrationLogger.logWarning(request.requestId, `No valid provider found for request source: ${request.source}`);
        metrics?.recordProviderFailure();
        
        executionPromises.push(Promise.resolve({
          requestId: request.requestId,
          status: EvidenceStatus.ERROR,
          evidence: null,
          errors: [`No valid provider found for source: ${request.source}`]
        }));
        continue;
      }

      // Schedule execution with timeout
      const timeoutMs = request.timeoutMs || 5000; // default 5s
      
      EvidenceOrchestrationLogger.logProviderExecutionStarted(request.requestId, request.source, orderIndex++);
      const startTime = Date.now();
      
      const providerPromise = provider.collectEvidence(request).then(res => {
        const duration = Date.now() - startTime;
        EvidenceOrchestrationLogger.logProviderExecutionCompleted(request.requestId, request.source, duration);
        metrics?.recordProviderLatency(request.source, duration);
        if (res.status === EvidenceStatus.VALID) {
          metrics?.recordProviderSuccess(res.evidence ? 1 : 0);
        } else {
          metrics?.recordProviderFailure();
        }
        return res;
      });
      
      executionPromises.push(
        FailureManager.executeWithTimeout(request.requestId, request.source, providerPromise, timeoutMs)
      );
    }

    // Wait for all providers to finish (or timeout)
    const responses = await Promise.all(executionPromises);
    return responses;
  }
}
