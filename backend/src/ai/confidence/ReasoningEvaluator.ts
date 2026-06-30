import { DecisionState, StopReason } from '../reasoning/models/decisionModels';

export class ReasoningEvaluator {
  /**
   * Assesses the stability of the reasoning process.
   */
  public evaluate(state: DecisionState): { reasoningScore: number; notes: string[]; positiveFactors: string[]; negativeFactors: string[] } {
    const notes: string[] = [];
    const positiveFactors: string[] = [];
    const negativeFactors: string[] = [];
    let reasoningScore = 100;

    // Evaluate iteration count
    if (state.iterationCount > 3) {
      notes.push(`Reasoning required ${state.iterationCount} iterations, indicating high complexity or instability.`);
      negativeFactors.push(`Reasoning required ${state.iterationCount} iterations, indicating high complexity or instability.`);
      reasoningScore -= 10;
    } else {
      notes.push(`Reasoning converged efficiently in ${state.iterationCount} iterations.`);
      positiveFactors.push(`Reasoning converged efficiently in ${state.iterationCount} iterations.`);
    }

    // Evaluate stopping condition
    switch (state.stopReason) {
      case StopReason.SUFFICIENT_EVIDENCE:
      case StopReason.NO_UNCERTAINTY:
        notes.push('Reasoning converged naturally with sufficient evidence.');
        positiveFactors.push('Reasoning converged naturally with sufficient evidence.');
        break;
      case StopReason.IMMATERIAL_IMPROVEMENT:
        notes.push('Reasoning stopped because further evidence would not materially improve the recommendation.');
        positiveFactors.push('Reasoning stopped because further evidence would not materially improve the recommendation.');
        reasoningScore -= 5;
        break;
      case StopReason.NO_USEFUL_TOOLS:
        notes.push('Reasoning stopped because no useful tools were available to gather missing evidence.');
        negativeFactors.push('Reasoning stopped because no useful tools were available to gather missing evidence.');
        reasoningScore -= 15;
        break;
      case StopReason.MAX_ITERATIONS:
        notes.push('Reasoning was forcibly terminated due to maximum iteration limit.');
        negativeFactors.push('Reasoning was forcibly terminated due to maximum iteration limit.');
        reasoningScore -= 30;
        break;
      case StopReason.SAFETY_LIMIT:
        notes.push('Reasoning was forcibly terminated due to runtime safety limits.');
        negativeFactors.push('Reasoning was forcibly terminated due to runtime safety limits.');
        reasoningScore -= 50;
        break;
      default:
        notes.push('Reasoning stopped for an unknown reason.');
        negativeFactors.push('Reasoning stopped for an unknown reason.');
        reasoningScore -= 20;
    }

    // Evaluate unresolved uncertainties
    if (state.decisionResult?.unresolvedUncertainties) {
      const numUncertainties = state.decisionResult.unresolvedUncertainties.length;
      if (numUncertainties > 0) {
        notes.push(`Decision has ${numUncertainties} unresolved uncertainties.`);
        negativeFactors.push(`Decision has ${numUncertainties} unresolved uncertainties.`);
        // Penalize 10 points per uncertainty, max 30 penalty
        reasoningScore -= Math.min(numUncertainties * 10, 30);
      } else {
        notes.push('No unresolved uncertainties remain.');
        positiveFactors.push('No unresolved uncertainties remain.');
      }
    }

    // Floor at 0
    reasoningScore = Math.max(0, reasoningScore);

    return { reasoningScore, notes, positiveFactors, negativeFactors };
  }
}
