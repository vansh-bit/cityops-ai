import { randomUUID } from 'crypto';
import type { IAIService } from '../services/AIService';
import { AIParsingError } from '../exceptions';
import type { AILogger } from '../logging/aiLogger';
import type { DecisionState, EvidencePlan, ToolRequest } from './models';

export interface IEvidencePlanner {
  planEvidence(state: DecisionState): Promise<ToolRequest | null>;
}

export interface EvidencePlannerDependencies {
  aiService: IAIService;
  aiLogger: AILogger;
}

export class EvidencePlanner implements IEvidencePlanner {
  constructor(private readonly dependencies: EvidencePlannerDependencies) {}

  async planEvidence(state: DecisionState): Promise<ToolRequest | null> {
    this.dependencies.aiLogger.logExecutionStarted({
      traceId: state.executionId,
      promptId: 'tool-selection',
      details: ['Evidence planning phase started', `Iteration: ${state.iterationCount}`],
    });

    const promptText = `
You are the Evidence Planner. Review the current Decision State and determine if ONE specific tool should be invoked to gather missing evidence.
If no further evidence is required or no tool can provide the missing information, return a JSON object with "requiresTool": false.
If a tool is needed, return a JSON object with "requiresTool": true, and provide the tool details.
DO NOT request a tool if it has already been requested (check toolRequests history) and failed, or if it already succeeded.

Decision State Summary:
Perception: ${JSON.stringify(state.perception)}
Reasoning Context: ${JSON.stringify(state.reasoningContext)}
Previous Tool Requests: ${JSON.stringify(state.toolRequests.map(tr => tr.toolId))}
Observations Received: ${JSON.stringify(state.observations.map(o => ({ source: o.source, status: o.status })))}

Return a JSON object matching this schema:
{
  "requiresTool": boolean,
  "evidencePlan": {
    "missingInformation": "string",
    "requiredTool": "string (Tool ID)",
    "justification": "string (Why do we need this?)",
    "expectedObservation": "string (What should the tool return?)",
    "inputs": { ...tool specific inputs... }
  } // Only required if requiresTool is true
}
`;

    const response = await this.dependencies.aiService.generateResponse({
      promptId: 'tool-selection',
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
      const parsed = JSON.parse(response.outputText) as {
        requiresTool: boolean;
        evidencePlan?: EvidencePlan & { inputs: Record<string, unknown> };
      };

      if (!parsed.requiresTool) {
        this.dependencies.aiLogger.logExecutionCompleted({
          traceId: state.executionId,
          promptId: 'tool-selection',
          promptVersion: response.promptVersion,
          model: response.model,
          durationMs: response.latencyMs,
          totalTokenCount: response.usage?.totalTokenCount,
          details: ['Evidence planning completed: No tool required'],
        });
        return null;
      }

      if (!parsed.evidencePlan || !parsed.evidencePlan.requiredTool || !parsed.evidencePlan.justification) {
        throw new AIParsingError('Response JSON missing evidencePlan details when requiresTool is true', [response.outputText]);
      }

      // EC-08: Every Tool Request SHALL contain explicit justification.
      const toolRequest: ToolRequest = {
        requestId: randomUUID(),
        toolId: parsed.evidencePlan.requiredTool,
        reason: parsed.evidencePlan.justification,
        inputs: parsed.evidencePlan.inputs || {},
        expectedObservation: parsed.evidencePlan.expectedObservation,
        originatingStep: state.iterationCount,
        timestamp: new Date().toISOString(),
      };

      this.dependencies.aiLogger.logExecutionCompleted({
        traceId: state.executionId,
        promptId: 'tool-selection',
        promptVersion: response.promptVersion,
        model: response.model,
        durationMs: response.latencyMs,
        totalTokenCount: response.usage?.totalTokenCount,
        details: [`Evidence planning completed: Requested tool ${toolRequest.toolId}`],
      });

      return toolRequest;
    } catch (err: any) {
      this.dependencies.aiLogger.logExecutionFailed('Failed to parse Evidence Planner response', {
        traceId: state.executionId,
        promptId: 'tool-selection',
        details: [err.message],
      });
      if (err instanceof AIParsingError) {
        throw err;
      }
      throw new AIParsingError('Failed to parse JSON response', [err.message]);
    }
  }
}
