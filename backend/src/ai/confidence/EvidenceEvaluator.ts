import { DecisionState } from '../reasoning/models/decisionModels';
import { EvidenceQuality } from './models/confidenceModels';

export class EvidenceEvaluator {
  /**
   * Assesses the completeness, quantity, and relevance of evidence gathered during reasoning.
   */
  public evaluate(state: DecisionState): { quality: EvidenceQuality; evidenceScore: number; notes: string[] } {
    const notes: string[] = [];
    const observations = state.observations;
    const evidencePlans = state.evidencePlans;
    
    // Evaluate completeness
    const totalPlans = evidencePlans.length;
    let completedPlans = 0;
    let failures = 0;

    for (const obs of observations) {
      if (obs.status === 'success') {
        completedPlans++;
      } else {
        failures++;
      }
    }

    if (totalPlans > 0 && completedPlans === totalPlans) {
      notes.push('All evidence plans were successfully fulfilled.');
    } else if (totalPlans > 0 && completedPlans < totalPlans) {
      notes.push(`Only ${completedPlans} out of ${totalPlans} evidence plans were fulfilled.`);
    }

    if (failures > 0) {
      notes.push(`${failures} observations returned failures or timeouts.`);
    }

    if (totalPlans === 0 && observations.length === 0) {
      notes.push('No evidence was planned or gathered. Relying entirely on initial perception.');
    }

    // Determine numerical score (0 to 100)
    let evidenceScore = 100;

    if (totalPlans > 0) {
      const completionRatio = completedPlans / totalPlans;
      evidenceScore = completionRatio * 100;
    } else {
      // If no plans were made, evidence is based purely on perception. It's acceptable, but not exhaustive.
      evidenceScore = 80;
    }

    // Penalize heavily for failures
    evidenceScore -= failures * 20;
    
    // Floor at 0
    evidenceScore = Math.max(0, evidenceScore);

    // Map score to Quality Level
    let quality = EvidenceQuality.ACCEPTABLE;
    if (evidenceScore >= 90) {
      quality = EvidenceQuality.EXCELLENT;
    } else if (evidenceScore >= 75) {
      quality = EvidenceQuality.GOOD;
    } else if (evidenceScore >= 50) {
      quality = EvidenceQuality.ACCEPTABLE;
    } else if (evidenceScore >= 30) {
      quality = EvidenceQuality.WEAK;
    } else {
      quality = EvidenceQuality.INSUFFICIENT;
    }

    return { quality, evidenceScore, notes };
  }
}
