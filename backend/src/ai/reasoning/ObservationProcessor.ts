import type { IAIService } from '../services/AIService';
import { AIParsingError, AIValidationError } from '../exceptions';
import type { AILogger } from '../logging/aiLogger';
import type { DecisionState, Observation, ReasoningContext } from './models';
import type { IDecisionStateManager } from './DecisionStateManager';

export interface IObservationProcessor {
  processObservation(state: DecisionState, observation: Observation): Promise<DecisionState>;
}

export interface ObservationProcessorDependencies {
  aiService: IAIService;
  aiLogger: AILogger;
  stateManager: IDecisionStateManager;
}

export class ObservationProcessor implements IObservationProcessor {
  constructor(private readonly dependencies: ObservationProcessorDependencies) {}

  async processObservation(state: DecisionState, observation: Observation): Promise<DecisionState> {
    this.dependencies.aiLogger.logExecutionStarted({
      traceId: state.executionId,
      promptId: 'decision',
      details: ['Observation processing started', `Observation ID: ${observation.observationId}`],
    });

    // Validate observation
    if (!observation.observationId || !observation.requestId || !observation.source || !observation.status) {
      throw new AIValidationError('Malformed observation: missing required fields', [JSON.stringify(observation)]);
    }

    // Associate observation with originating request (INV-02)
    const originalRequest = state.toolRequests.find(req => req.requestId === observation.requestId);
    if (!originalRequest) {
      this.dependencies.aiLogger.logExecutionFailed('Observation references unknown Tool Request ID', {
        traceId: state.executionId,
        details: [`Observation Request ID: ${observation.requestId}`],
      });
      // Spec: Reject observation if missing tool request
      throw new AIValidationError('Observation references unknown Tool Request ID', [observation.requestId]);
    }

    // Step 1: Add the raw observation to the state
    let newState = this.dependencies.stateManager.addObservation(state, observation);

    // Step 2: Use AI to update the Reasoning Context
    const promptText = `
You are processing a newly received observation from a tool.
Update the reasoning context based on this new information.
Review the previous reasoning context and the new observation. Identify newly confirmed facts, update assumptions, remove resolved uncertainties, and identify any new uncertainties or evidence requirements if they exist.

Previous Reasoning Context: ${JSON.stringify(newState.reasoningContext, null, 2)}
Tool Requested: ${originalRequest.toolId}
Expected Observation: ${originalRequest.expectedObservation}
Received Observation: ${JSON.stringify(observation, null, 2)}

Return a JSON object matching this schema with the UPDATED reasoning context:
{
  "confirmedFacts": ["list of strings"],
  "assumptions": ["list of strings"],
  "uncertainties": ["list of strings"],
  "evidenceRequirements": ["list of strings"]
}
`;

    const response = await this.dependencies.aiService.generateResponse({
      promptId: 'decision',
      traceId: newState.executionId,
      responseMimeType: 'application/json',
      contents: [
        {
          type: 'text',
          text: promptText,
        },
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

      // Step 3: Update state with new context
      newState = this.dependencies.stateManager.updateReasoningContext(newState, parsed);

      // Step 4: Append reasoning history
      newState = this.dependencies.stateManager.addReasoningEntry(newState, {
        stepType: 'observation_received',
        description: `Processed observation from tool: ${originalRequest.toolId}. Status: ${observation.status}`,
        metadata: {
          observationId: observation.observationId,
          toolId: originalRequest.toolId,
        },
      });

      this.dependencies.aiLogger.logExecutionCompleted({
        traceId: newState.executionId,
        promptId: 'decision',
        promptVersion: response.promptVersion,
        model: response.model,
        durationMs: response.latencyMs,
        totalTokenCount: response.usage?.totalTokenCount,
        details: ['Observation processing completed successfully'],
      });

      return newState;
    } catch (err: any) {
      this.dependencies.aiLogger.logExecutionFailed('Failed to parse Observation Processing response', {
        traceId: newState.executionId,
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
