/**
 * evidenceContracts.ts
 * Shared, provider-independent evidence contracts for the Evidence Collection Layer.
 */

export enum EvidenceSource {
  GOOGLE_MAPS = 'GOOGLE_MAPS',
  VISION_ANALYSIS = 'VISION_ANALYSIS',
  MUNICIPAL = 'MUNICIPAL',
  UNKNOWN = 'UNKNOWN'
}

export enum EvidenceStatus {
  VALID = 'VALID',
  INVALID = 'INVALID',
  PARTIAL = 'PARTIAL',
  ERROR = 'ERROR'
}

export interface EvidenceMetadata {
  providerId: string;
  source: EvidenceSource;
  timestamp: string;
  executionDurationMs?: number;
  confidenceScore?: number;
  providerVersion?: string;
}

export interface Evidence {
  id: string;
  metadata: EvidenceMetadata;
  status: EvidenceStatus;
  data: Record<string, any>;
  errors?: string[];
}

export interface EvidenceRequest {
  requestId: string;
  source: EvidenceSource;
  parameters: Record<string, any>;
  timeoutMs?: number;
}

export interface EvidenceResponse {
  requestId: string;
  evidence: Evidence | null;
  status: EvidenceStatus;
  errors?: string[];
}
