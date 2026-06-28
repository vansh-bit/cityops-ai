import { ExecutionMonitor } from '../ExecutionMonitor';
import { AILogger } from '../../../ai/logging/aiLogger';

describe('ExecutionMonitor', () => {
  let monitor: ExecutionMonitor;
  let mockLogger: jest.Mocked<AILogger>;

  beforeEach(() => {
    mockLogger = {
      logExecutionStarted: jest.fn(),
      logExecutionCompleted: jest.fn(),
      logExecutionFailed: jest.fn(),
    } as unknown as jest.Mocked<AILogger>;
    
    monitor = new ExecutionMonitor(mockLogger);
  });

  it('should successfully execute a promise within timeout', async () => {
    const operation = jest.fn().mockResolvedValue('success');
    const context = { toolId: 'test-tool', requestId: 'req-123' };

    const { result, metrics } = await monitor.executeWithTimeout(operation, 1000, context);

    expect(result).toBe('success');
    expect(metrics.durationMs).toBeGreaterThanOrEqual(0);
    expect(mockLogger.logExecutionStarted).toHaveBeenCalled();
    expect(mockLogger.logExecutionCompleted).toHaveBeenCalled();
  });

  it('should timeout an execution that takes too long', async () => {
    const operation = () => new Promise(resolve => setTimeout(() => resolve('success'), 100));
    const context = { toolId: 'test-tool', requestId: 'req-123' };

    await expect(monitor.executeWithTimeout(operation, 10, context)).rejects.toThrow('TIMEOUT');
    
    expect(mockLogger.logExecutionFailed).toHaveBeenCalledWith(
      expect.stringContaining('timed out'),
      expect.objectContaining({
        details: expect.arrayContaining([expect.stringContaining('timed out')])
      })
    );
  });

  it('should capture and log a natural error from the operation', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Internal Bug'));
    const context = { toolId: 'test-tool', requestId: 'req-123' };

    await expect(monitor.executeWithTimeout(operation, 1000, context)).rejects.toThrow('Internal Bug');
    
    expect(mockLogger.logExecutionFailed).toHaveBeenCalledWith(
      expect.stringContaining('Internal Bug'),
      expect.objectContaining({
        details: expect.arrayContaining([expect.stringContaining('Internal Bug')])
      })
    );
  });
});
