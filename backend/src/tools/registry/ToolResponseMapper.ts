import crypto from 'crypto';
import { Observation, ToolRequest } from '../../ai/reasoning/models/decisionModels';
import { ITool, ToolResponse } from '../contracts';

export class ToolResponseMapper {
  /**
   * Maps a successful tool execution to a standardized Observation.
   */
  public mapToObservation(
    request: ToolRequest,
    tool: ITool,
    response: ToolResponse,
    executionMetadata: { durationMs: number; startedAt: string; completedAt: string }
  ): Observation {
    return {
      observationId: crypto.randomUUID(),
      source: tool.metadata.toolId,
      type: tool.metadata.outputType,
      payload: response.data,
      status: 'success',
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generates a failure observation if execution was unsuccessful or timed out.
   */
  public createFailureObservation(
    request: ToolRequest,
    toolId: string,
    reason: string,
    status: 'failure' | 'timeout' = 'failure'
  ): Observation {
    return {
      observationId: crypto.randomUUID(),
      source: toolId,
      type: 'error',
      payload: { error: reason },
      status,
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
    };
  }
}
