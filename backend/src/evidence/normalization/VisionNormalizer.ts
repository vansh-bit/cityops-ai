import { EvidenceNormalizer } from '../interfaces/evidenceInterfaces';

export class VisionNormalizer implements EvidenceNormalizer<any> {
  normalize(rawResponse: any): Record<string, any> {
    if (!rawResponse || typeof rawResponse !== 'object') {
      return {};
    }
    
    // Normalize vision analysis (e.g. Gemini Vision API response)
    return {
      observations: Array.isArray(rawResponse.observations) ? rawResponse.observations : [],
      severity: rawResponse.severity || 'UNKNOWN',
      tags: Array.isArray(rawResponse.tags) ? rawResponse.tags : [],
      description: rawResponse.description || 'No description provided',
      safetyHazards: Array.isArray(rawResponse.safetyHazards) ? rawResponse.safetyHazards : [],
    };
  }
}
