import { withRetry } from '../RetryHelper';

describe('RetryHelper', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should succeed on first attempt without retrying', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const result = await withRetry('test-op', mockFn);

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry transient errors and succeed', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('network timeout'))
      .mockRejectedValueOnce(new Error('connection reset'))
      .mockResolvedValue('success');

    const promise = withRetry('test-op', mockFn, { baseDelayMs: 100 });
    
    // Fast-forward timers to flush promises and timeouts
    await jest.runAllTimersAsync();
    
    const result = await promise;

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should not retry permanent errors', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('permission denied'));
    
    await expect(withRetry('test-op', mockFn)).rejects.toThrow('permission denied');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should fail after max attempts on transient errors', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('unavailable'));
    
    const promise = withRetry('test-op', mockFn, { maxAttempts: 3, baseDelayMs: 100 });
    
    await jest.runAllTimersAsync();
    
    await expect(promise).rejects.toThrow('unavailable');
    expect(mockFn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('should respect the max window limit', async () => {
    const mockFn = jest.fn().mockImplementation(async () => {
      throw new Error('timeout');
    });
    
    const promise = withRetry('test-op', mockFn, { maxAttempts: 5, baseDelayMs: 1000, maxWindowMs: 2000 });
    
    await jest.runAllTimersAsync();
    
    await expect(promise).rejects.toThrow('timeout');
    // Shouldn't reach 5 attempts because of the 2000ms max window
    expect(mockFn.mock.calls.length).toBeLessThan(5); 
  });
});
