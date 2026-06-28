import type { IAIService } from '../services/AIService';
import { AIParsingError, AIValidationError } from '../exceptions';
import type { AILogger } from '../logging/aiLogger';
import type { DecisionResult, DecisionState } from './models';

export interface IDecisionGenerator {
  generateDecision(state: DecisionState): Promise<DecisionResult>;
}

export interface DecisionGeneratorDependencies {
  aiService: IAIService;
  aiLogger: AILogger;
}

export class DecisionGenerator implements IDecisionGenerator {
  constructor(private readonly dependencies: DecisionGeneratorDependencies) {}

  async generateDecision(state: DecisionState): Promise<DecisionResult> {
    if (!state.stopped) {
      throw new AIValidationError('Cannot generate decision before reasoning is explicitly stopped. (INV-08)', []);
    }

    if (state.decisionResult) {
      throw new AIValidationError('Decision result already exists. (INV-08)', []);
    }

    this.dependencies.aiLogger.logExecutionStarted({
      traceId: state.executionId,
      promptId: 'decision',
      details: ['Decision generation phase started'],
    });

    const promptText = `
You are generating the final structured operational recommendation.
Review the complete Decision State, including the original perception, reasoning context, requested tools, and gathered observations.
Generate a municipality-ready operational recommendation.
Do NOT output any confidence value.

Decision State Summary:
Perception: ${JSON.stringify(state.perception)}
Final Reasoning Context: ${JSON.stringify(state.reasoningContext)}
Observations Collected: ${JSON.stringify(state.observations)}
Stop Reason: ${state.stopReason}

Return a JSON object matching this schema:
{
  "issueClassification": "string",
  "departmentRecommendation": "string",
  "priorityRecommendation": "string",
  "reasoning": "string (structured explanation)",
  "supportingEvidence": ["list of strings summarizing evidence used"],
  "unresolvedUncertainties": ["list of strings (any remaining unknowns)"],
  "escalationRecommendation": "string (e.g., 'None', 'Review suggested due to missing evidence', etc.)"
}
`;

    const response = await this.dependencies.aiService.generateResponse({
      promptId: 'decision',
      traceId: state.executionId,
      responseMimeType: 'application/json',
      contents: [
        {
          type: 'text',
          text: promptText,
        },
      ],
    });

    try {
      const parsed = JSON.parse(response.outputText) as Partial<DecisionResult>;

      // Validate required fields
      if (
        !parsed.issueClassification ||
        !parsed.departmentRecommendation ||
        !parsed.priorityRecommendation ||
        !parsed.reasoning ||
        !Array.isArray(parsed.supportingEvidence) ||
        !Array.isArray(parsed.unresolvedUncertainties) ||
        !parsed.escalationRecommendation
      ) {
        throw new AIParsingError('Response JSON missing required DecisionResult fields', [response.outputText]);
      }

      const decisionResult: DecisionResult = {
        issueClassification: parsed.issueClassification,
        departmentRecommendation: parsed.departmentRecommendation,
        priorityRecommendation: parsed.priorityRecommendation,
        reasoning: parsed.reasoning,
        supportingEvidence: parsed.supportingEvidence,
        unresolvedUncertainties: parsed.unresolvedUncertainties,
        escalationRecommendation: parsed.escalationRecommendation,
        timestamp: new Date().toISOString(),
      };

      this.dependencies.aiLogger.logExecutionCompleted({
        traceId: state.executionId,
        promptId: 'decision',
        promptVersion: response.promptVersion,
        model: response.model,
        durationMs: response.latencyMs,
        totalTokenCount: response.usage?.totalTokenCount,
        details: ['Decision generation completed successfully'],
      });

      return decisionResult;
    } catch (err: any) {
      this.dependencies.aiLogger.logExecutionFailed('Failed to parse Decision Generator response', {
        traceId: state.executionId,
        promptId: 'decision',
        details: [err.message],
      });
      if (err instanceof AIParsingError) {
        throw err;
      }
      throw new AIParsingError('Failed to parse JSON response', [err.message]);
    }
  }
}
