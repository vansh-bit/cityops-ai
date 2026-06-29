import { Evidence, EvidenceMetadata, EvidenceSource, EvidenceStatus } from '../contracts/evidenceContracts';

// Pure type utilities - not relying on zod to avoid unapproved dependencies

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function isValidIsoDate(dateString: string): boolean {
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(dateString) && 
      !/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/.test(dateString)) return false;
  const d = new Date(dateString);
  return d instanceof Date && !isNaN(d.getTime());
}

export function validateEvidenceMetadata(metadata: any): string[] {
  const errors: string[] = [];
  if (!metadata) {
    errors.push('metadata is missing');
    return errors;
  }
  if (!metadata.providerId || typeof metadata.providerId !== 'string' || metadata.providerId.trim() === '') {
    errors.push('metadata.providerId: Provider ID is required');
  }
  if (!Object.values(EvidenceSource).includes(metadata.source)) {
    errors.push('metadata.source: Invalid evidence source');
  }
  if (!metadata.timestamp || !isValidIsoDate(metadata.timestamp)) {
    errors.push('metadata.timestamp: Timestamp must be a valid ISO datetime');
  }
  if (metadata.confidenceScore !== undefined && (typeof metadata.confidenceScore !== 'number' || metadata.confidenceScore < 0 || metadata.confidenceScore > 1)) {
    errors.push('metadata.confidenceScore: Must be a number between 0 and 1');
  }
  return errors;
}

export function validateEvidenceSchema(evidence: any): string[] {
  const errors: string[] = [];
  
  if (!evidence) {
    errors.push('Evidence object is missing');
    return errors;
  }
  
  if (!evidence.id || typeof evidence.id !== 'string' || !isValidUUID(evidence.id)) {
    errors.push('id: Evidence ID must be a valid UUID');
  }
  
  if (!Object.values(EvidenceStatus).includes(evidence.status)) {
    errors.push('status: Invalid evidence status');
  }
  
  const metadataErrors = validateEvidenceMetadata(evidence.metadata);
  errors.push(...metadataErrors);
  
  if (evidence.status === EvidenceStatus.ERROR) {
    if (!evidence.errors || !Array.isArray(evidence.errors) || evidence.errors.length === 0) {
      errors.push('errors: Invalid evidence structure based on status');
    }
  }
  
  if (evidence.status === EvidenceStatus.VALID) {
    if (!evidence.data || Object.keys(evidence.data).length === 0 || (evidence.errors && evidence.errors.length > 0)) {
      errors.push('data: Invalid evidence structure based on status');
    }
  }

  return errors;
}
