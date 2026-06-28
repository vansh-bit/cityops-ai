import { ToolDispatcher } from '../ToolDispatcher';
import { IToolRegistry, ToolRegistry } from '../ToolRegistry';
import { ToolValidator, ToolValidationError } from '../ToolValidator';
import { ToolResponseMapper } from '../ToolResponseMapper';
import { ExecutionMonitor } from '../ExecutionMonitor';
import { AILogger } from '../../../ai/logging/aiLogger';
import { ITool } from '../../contracts';
import { ToolRequest } from '../../../ai/reasoning/models/decisionModels';

describe('ToolDispatcher', () => {
  let dispatcher: ToolDispatcher;
  let mockRegistry: jest.Mocked<IToolRegistry>;
  let mockValidator: jest.Mocked<ToolValidator>;
  let mockMapper: jest.Mocked<ToolResponseMapper>;
  let mockMonitor: jest.Mocked<ExecutionMonitor>;
  let mockLogger: jest.Mocked<AILogger>;
  let mockTool: jest.Mocked<ITool>;

  const mockRequest: ToolRequest = {
    requestId: 'req-123',
    toolId: 'test-tool',
    reason: 'testing',
    inputs: {},
    expectedObservation: 'test',
    originatingStep: 1,
    timestamp: '2026-06-28T00:00:00Z'
  };

  beforeEach(() => {
    mockTool = {
      metadata: {
        toolId: 'test-tool',
        name: 'Test Tool',
        category: 'Test',
        purpose: 'Testing',
        requiredInputs: [],
        outputType: 'test_output',
        timeoutMs: 1000,
        enabled: true,
        version: '1.0.0'
      },
      execute: jest.fn().mockResolvedValue({ data: { success: true } })
    };

    mockRegistry = {
      registerTool: jest.fn(),
      getTool: jest.fn().mockReturnValue(mockTool),
      getAllTools: jest.fn(),
      hasTool: jest.fn().mockReturnValue(true)
    };

    mockValidator = {
      validateRequest: jest.fn(),
      validateResponse: jest.fn()
    } as unknown as jest.Mocked<ToolValidator>;

    mockMapper = {
      mapToObservation: jest.fn().mockReturnValue({ status: 'success' }),
      createFailureObservation: jest.fn().mockReturnValue({ status: 'failure' })
    } as unknown as jest.Mocked<ToolResponseMapper>;

    mockMonitor = {
      executeWithTimeout: jest.fn().mockResolvedValue({
        result: { data: { success: true } },
        metrics: { durationMs: 100, startedAt: 'time', completedAt: 'time' }
      })
    } as unknown as jest.Mocked<ExecutionMonitor>;

    mockLogger = {
      logExecutionStarted: jest.fn(),
      logExecutionCompleted: jest.fn(),
      logExecutionFailed: jest.fn(),
    } as unknown as jest.Mocked<AILogger>;

    dispatcher = new ToolDispatcher(
      mockRegistry,
      mockValidator,
      mockMapper,
      mockMonitor,
      mockLogger
    );
  });

  it('should successfully dispatch and return an observation', async () => {
    const result = await dispatcher.dispatch(mockRequest);
    
    expect(mockRegistry.hasTool).toHaveBeenCalledWith('test-tool');
    expect(mockValidator.validateRequest).toHaveBeenCalledWith(mockRequest, mockTool);
    expect(mockMonitor.executeWithTimeout).toHaveBeenCalled();
    expect(mockValidator.validateResponse).toHaveBeenCalled();
    expect(mockMapper.mapToObservation).toHaveBeenCalled();
    expect(result.status).toBe('success');
  });

  it('should return failure observation if tool is not registered', async () => {
    mockRegistry.hasTool.mockReturnValue(false);
    
    const result = await dispatcher.dispatch(mockRequest);
    expect(mockMapper.createFailureObservation).toHaveBeenCalledWith(mockRequest, 'test-tool', 'Tool not found');
    expect(result.status).toBe('failure');
  });

  it('should return failure observation if request validation fails', async () => {
    mockValidator.validateRequest.mockImplementation(() => {
      throw new ToolValidationError('Invalid request');
    });
    
    const result = await dispatcher.dispatch(mockRequest);
    expect(mockMapper.createFailureObservation).toHaveBeenCalledWith(mockRequest, 'test-tool', 'Invalid request');
    expect(result.status).toBe('failure');
  });

  it('should return timeout observation if execution times out', async () => {
    mockMonitor.executeWithTimeout.mockRejectedValue(new Error('TIMEOUT'));
    mockMapper.createFailureObservation.mockReturnValueOnce({ status: 'timeout' } as any);
    
    const result = await dispatcher.dispatch(mockRequest);
    expect(mockMapper.createFailureObservation).toHaveBeenCalledWith(
      mockRequest, 'test-tool', 'Tool execution timed out', 'timeout'
    );
    expect(result.status).toBe('timeout');
  });
  
  it('should return failure observation if execution throws unknown error', async () => {
    mockMonitor.executeWithTimeout.mockRejectedValue(new Error('Internal exception'));
    
    const result = await dispatcher.dispatch(mockRequest);
    expect(mockMapper.createFailureObservation).toHaveBeenCalledWith(
      mockRequest, 'test-tool', 'Internal tool execution error', 'failure'
    );
    expect(result.status).toBe('failure');
  });

  it('should return failure observation if response validation fails', async () => {
    mockValidator.validateResponse.mockImplementation(() => {
      throw new ToolValidationError('Invalid response');
    });
    
    const result = await dispatcher.dispatch(mockRequest);
    expect(mockMapper.createFailureObservation).toHaveBeenCalledWith(
      mockRequest, 'test-tool', 'Invalid response'
    );
    expect(result.status).toBe('failure');
  });
});
