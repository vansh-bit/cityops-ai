import { EvidenceValidator } from '../validation/EvidenceValidator';
import { EvidenceSource, EvidenceStatus, Evidence } from '../contracts/evidenceContracts';
import { randomUUID } from 'crypto';

describe('EvidenceValidator', () => {
  let validator: EvidenceValidator;

  beforeEach(() => {
    validator = new EvidenceValidator();
  });

  const getValidEvidence = (): Evidence => ({
    id: randomUUID(),
    status: EvidenceStatus.VALID,
    data: { key: 'value' },
    metadata: {
      providerId: 'test-provider',
      source: EvidenceSource.MUNICIPAL,
      timestamp: new Date().toISOString()
    }
  });

  it('validates a correct evidence object', () => {
    const evidence = getValidEvidence();
    expect(validator.validate(evidence)).toBe(true);
    expect(validator.getErrors(evidence)).toHaveLength(0);
  });

  it('fails validation when metadata is missing providerId', () => {
    const evidence = getValidEvidence();
    evidence.metadata.providerId = '';
    
    expect(validator.validate(evidence)).toBe(false);
    expect(validator.getErrors(evidence)).toContain('metadata.providerId: Provider ID is required');
  });

  it('fails validation when status is VALID but data is empty', () => {
    const evidence = getValidEvidence();
    evidence.data = {};
    
    expect(validator.validate(evidence)).toBe(false);
    // Should throw an error related to data keys length or refine message
    expect(validator.getErrors(evidence)[0]).toContain('Invalid evidence structure based on status');
  });

  it('allows empty data when status is ERROR', () => {
    const evidence = getValidEvidence();
    evidence.status = EvidenceStatus.ERROR;
    evidence.data = {};
    evidence.errors = ['Something went wrong'];
    
    expect(validator.validate(evidence)).toBe(true);
    expect(validator.getErrors(evidence)).toHaveLength(0);
  });

  it('fails validation if status is ERROR but no errors array is provided', () => {
    const evidence = getValidEvidence();
    evidence.status = EvidenceStatus.ERROR;
    delete evidence.errors;
    
    expect(validator.validate(evidence)).toBe(false);
    expect(validator.getErrors(evidence)[0]).toContain('Invalid evidence structure based on status');
  });

  it('fails if ID is not a UUID', () => {
    const evidence = getValidEvidence();
    evidence.id = 'not-a-uuid';
    
    expect(validator.validate(evidence)).toBe(false);
    expect(validator.getErrors(evidence)).toContain('id: Evidence ID must be a valid UUID');
  });

  it('fails if timestamp is invalid', () => {
    const evidence = getValidEvidence();
    evidence.metadata.timestamp = 'invalid-time';
    
    expect(validator.validate(evidence)).toBe(false);
    expect(validator.getErrors(evidence)).toContain('metadata.timestamp: Timestamp must be a valid ISO datetime');
  });
});
