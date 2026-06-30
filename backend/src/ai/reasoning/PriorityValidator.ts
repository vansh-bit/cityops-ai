export class PriorityValidator {
  /**
   * Applies lightweight guardrails to the AI's priority recommendation based on issue classification.
   * Does not replace the AI reasoning, just prevents hallucinated edge cases.
   */
  public static validatePriority(classification: any, rawPriority: any): string {
    if (!classification || typeof classification !== 'string' || !rawPriority || typeof rawPriority !== 'string') {
      return (typeof rawPriority === 'string' ? rawPriority : 'UNKNOWN');
    }

    const cls = classification.toLowerCase();
    const prio = rawPriority.toUpperCase();

    // Guardrail 1: Critical/Emergency issues must not be LOW or ROUTINE
    const criticalKeywords = ['collapse', 'rupture', 'sinkhole', 'fire', 'emergency', 'gas', 'explosion', 'fatality'];
    const isCriticalIssue = criticalKeywords.some(kw => cls.includes(kw));
    
    if (isCriticalIssue && (prio === 'LOW' || prio === 'ROUTINE')) {
      return 'HIGH'; // Elevate to High
    }

    // Guardrail 2: Cosmetic/Nuisance issues must not be CRITICAL
    const cosmeticKeywords = ['graffiti', 'cosmetic', 'litter', 'weeds', 'paint', 'noise'];
    const isCosmeticIssue = cosmeticKeywords.some(kw => cls.includes(kw));

    if (isCosmeticIssue && (prio === 'CRITICAL' || prio === 'EMERGENCY')) {
      return 'ROUTINE'; // Demote to Routine
    }

    // Default: Trust the AI
    return prio;
  }
}
