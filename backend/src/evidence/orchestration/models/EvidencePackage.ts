import { Evidence, EvidenceStatus } from '../../contracts/evidenceContracts';
import { OrchestrationMetricsPayload } from '../logging/EvidenceOrchestrationMetrics';

export interface EvidencePackageMetadata {
  orchestrationStartTime: string;
  orchestrationEndTime: string;
  durationMs: number;
  providersRequested: string[];
  providersCompleted: string[];
  providersFailed: string[];
  metrics?: OrchestrationMetricsPayload;
}

export interface EvidencePackage {
  packageId: string;
  requestId: string;
  status: EvidenceStatus;
  evidence: Evidence[];
  metadata: EvidencePackageMetadata;
  errors?: string[];
}
