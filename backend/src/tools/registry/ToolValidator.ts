import { ITool } from '../contracts';
import { ToolRequest } from '../../ai/reasoning/models/decisionModels';

export class ToolValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolValidationError';
  }
}

export class ToolValidator {
  /**
   * Validates a ToolRequest against a registered tool's capabilities.
   * Throws ToolValidationError if validation fails.
   */
  public validateRequest(request: ToolRequest, tool: ITool): void {
    if (!request.requestId) {
      throw new ToolValidationError('ToolRequest is missing requestId.');
    }
    
    if (request.toolId !== tool.metadata.toolId) {
      throw new ToolValidationError(
        `ToolRequest toolId '${request.toolId}' does not match registered tool ID '${tool.metadata.toolId}'.`
      );
    }
    
    if (!tool.metadata.enabled) {
      throw new ToolValidationError(`Tool '${tool.metadata.toolId}' is currently disabled.`);
    }

    // Verify required inputs are present
    const missingInputs = tool.metadata.requiredInputs.filter(
      (key) => !(key in request.inputs) || request.inputs[key] === undefined
    );

    if (missingInputs.length > 0) {
      throw new ToolValidationError(
        `ToolRequest for '${tool.metadata.toolId}' is missing required inputs: ${missingInputs.join(', ')}`
      );
    }
  }

  /**
   * Validates a raw response from a tool to ensure it meets the registry's minimum contracts.
   */
  public validateResponse(response: unknown): void {
    if (!response || typeof response !== 'object') {
      throw new ToolValidationError('Tool response must be an object.');
    }
    
    const obj = response as Record<string, unknown>;
    if (!('data' in obj) || typeof obj.data !== 'object' || obj.data === null) {
      throw new ToolValidationError('Tool response is missing required "data" payload.');
    }
  }
}
