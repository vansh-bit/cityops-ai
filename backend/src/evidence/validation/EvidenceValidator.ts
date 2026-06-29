import { Evidence } from '../contracts/evidenceContracts';
import { EvidenceValidator as IEvidenceValidator } from '../interfaces/evidenceInterfaces';
import { validateEvidenceSchema } from '../models/evidenceModels';

export class EvidenceValidator implements IEvidenceValidator {
  
  validate(evidence: Evidence): boolean {
    const errors = validateEvidenceSchema(evidence);
    return errors.length === 0;
  }

  getErrors(evidence: Evidence): string[] {
    return validateEvidenceSchema(evidence);
  }
}
