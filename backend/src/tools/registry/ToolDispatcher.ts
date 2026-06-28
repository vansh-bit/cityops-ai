import { Observation, ToolRequest } from '../../ai/reasoning/models/decisionModels';
import { IToolRegistry } from './ToolRegistry';
import { ToolValidator } from './ToolValidator';
import { ToolResponseMapper } from './ToolResponseMapper';
import { ExecutionMonitor } from './ExecutionMonitor';
import { AILogger } from '../../ai/logging/aiLogger';

export class ToolDispatcher {
  constructor(
    private readonly registry: IToolRegistry,
    private readonly validator: ToolValidator,
    private readonly mapper: ToolResponseMapper,
    private readonly monitor: ExecutionMonitor,
    private readonly logger: AILogger
  ) {}

  /**
   * Executes a ToolRequest deterministically.
   * Handles discovery, validation, execution, monitoring, and mapping.
   * Returns a standardized Observation (success, timeout, or failure).
   */
  public async dispatch(request: ToolRequest): Promise<Observation> {
    try {
      // 1. Tool Discovery
      if (!this.registry.hasTool(request.toolId)) {
        return this.mapper.createFailureObservation(request, request.toolId, 'Tool not found');
      }
      
      const tool = this.registry.getTool(request.toolId);

      // 2. Validation
      try {
        this.validator.validateRequest(request, tool);
      } catch (validationError) {
        return this.mapper.createFailureObservation(
          request, 
          request.toolId, 
          validationError instanceof Error ? validationError.message : 'Invalid request'
        );
      }

      // 3. Execution via Monitor
      const executionResult = await this.monitor.executeWithTimeout(
        () => tool.execute(request.inputs),
        tool.metadata.timeoutMs,
        { toolId: tool.metadata.toolId, requestId: request.requestId }
      );

      // 4. Response Validation
      try {
        this.validator.validateResponse(executionResult.result);
      } catch (responseValidationError) {
        return this.mapper.createFailureObservation(
          request,
          request.toolId,
          responseValidationError instanceof Error ? responseValidationError.message : 'Invalid response from tool'
        );
      }

      // 5. Observation Mapping
      return this.mapper.mapToObservation(request, tool, executionResult.result, executionResult.metrics);
      
    } catch (error) {
      // 6. Global Failure / Timeout Isolation
      const isTimeout = error instanceof Error && error.message === 'TIMEOUT';
      const reason = isTimeout ? 'Tool execution timed out' : 'Internal tool execution error';
      return this.mapper.createFailureObservation(
        request, 
        request.toolId, 
        reason,
        isTimeout ? 'timeout' : 'failure'
      );
    }
  }
}
