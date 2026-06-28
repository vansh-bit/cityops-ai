import type { IAIService } from '../services/AIService';
import { AIParsingError } from '../exceptions';
import type { AILogger } from '../logging/aiLogger';
import type { PerceptionResult, ReasoningContext } from './models';

export interface IInitialReasoning {
  analyze(perception: PerceptionResult, traceId: string): Promise<ReasoningContext>;
}

export interface InitialReasoningDependencies {
  aiService: IAIService;
  aiLogger: AILogger;
}

export class InitialReasoning implements IInitialReasoning {
  constructor(private readonly dependencies: InitialReasoningDependencies) {}

  async analyze(perception: PerceptionResult, traceId: string): Promise<ReasoningContext> {
    this.dependencies.aiLogger.logExecutionStarted({
      traceId,
      promptId: 'decision',
      details: ['Initial reasoning phase started'],
    });

    const promptText = `
You are performing Initial Reasoning on a new infrastructure issue report.
Given the following perception result, determine what is confirmed, what assumptions can be made, what uncertainties exist, and what evidence requirements are needed before making a final operational decision.

Perception Result:
${JSON.stringify(perception, null, 2)}

Return a JSON object matching this schema:
{
  "confirmedFacts": ["list of strings"],
  "assumptions": ["list of strings"],
  "uncertainties": ["list of strings"],
  "evidenceRequirements": ["list of strings"]
}
`;

    const response = await this.dependencies.aiService.generateResponse({
      promptId: 'decision',
      traceId,
      responseMimeType: 'application/json',
      contents: [
        {
          type: 'text',
          text: promptText,
        }
      ],
    });

    try {
      const parsed = JSON.parse(response.outputText) as ReasoningContext;
      
      if (!Array.isArray(parsed.confirmedFacts) || 
          !Array.isArray(parsed.assumptions) || 
          !Array.isArray(parsed.uncertainties) || 
          !Array.isArray(parsed.evidenceRequirements)) {
        throw new AIParsingError('Response JSON does not match ReasoningContext schema', [response.outputText]);
      }

      this.dependencies.aiLogger.logExecutionCompleted({
        traceId,
        promptId: 'decision',
        promptVersion: response.promptVersion,
        model: response.model,
        durationMs: response.latencyMs,
        totalTokenCount: response.usage?.totalTokenCount,
        details: ['Initial reasoning completed successfully'],
      });

      return parsed;
    } catch (err: any) {
      this.dependencies.aiLogger.logExecutionFailed('Failed to parse Initial Reasoning response', {
        traceId,
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
