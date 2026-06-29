import { Evidence, EvidenceRequest, EvidenceResponse } from '../contracts/evidenceContracts';

/**
 * Interface representing a deterministic external evidence provider.
 */
export interface EvidenceProvider {
  /**
   * Initializes the provider and validates configuration.
   * Fails fast if configuration is missing.
   */
  initialize(): Promise<void>;

  /**
   * Validates an incoming evidence request to ensure the provider can handle it.
   */
  validateRequest(request: EvidenceRequest): boolean;

  /**
   * Collects evidence from the external source based on the request.
   */
  collectEvidence(request: EvidenceRequest): Promise<EvidenceResponse>;
}

/**
 * Interface representing evidence validation.
 */
export interface EvidenceValidator {
  /**
   * Validates a normalized Evidence object.
   * Throws or returns errors if invalid.
   */
  validate(evidence: Evidence): boolean;
  getErrors(evidence: Evidence): string[];
}

/**
 * Interface representing an evidence normalizer.
 */
export interface EvidenceNormalizer<T = any> {
  /**
   * Normalizes raw provider response data into a standard evidence data format.
   */
  normalize(rawResponse: T): Record<string, any>;
}

/**
 * Orchestrator interface for collecting evidence across providers (for Phase 3).
 */
export interface EvidenceCollector {
  collect(requests: EvidenceRequest[]): Promise<EvidenceResponse[]>;
}
