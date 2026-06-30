import logger from '../../utils/logger';

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxWindowMs: number;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 200,
  maxWindowMs: 5000
};

/**
 * Determines if an error is transient and should be retried.
 */
function isTransientError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = (error.message || '').toLowerCase();
  const errorCode = (error.code || '').toLowerCase();

  // Retry on common network and transient state errors
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('network error') ||
    errorMessage.includes('connection reset') ||
    errorMessage.includes('socket hang up') ||
    errorMessage.includes('econnreset') ||
    errorMessage.includes('etimedout') ||
    errorMessage.includes('unavailable') ||
    errorCode === 'deadline_exceeded' ||
    errorCode === 'unavailable' ||
    errorCode === 'internal' ||
    errorCode === 'econnrefused'
  ) {
    return true;
  }

  return false;
}

/**
 * Phase 5C - Retry Utility (F-02)
 * Executes an asynchronous function with exponential backoff and randomized jitter.
 * Retries are ONLY performed for transient failures.
 */
export async function withRetry<T>(
  operationName: string,
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let attempt = 1;
  const startTime = Date.now();

  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      const timeElapsed = Date.now() - startTime;

      if (!isTransientError(error)) {
        logger.warn(`Non-transient error in ${operationName}, aborting retries`, { error: error.message, code: error.code });
        throw error;
      }

      if (attempt >= config.maxAttempts) {
        logger.error(`Max retries (${config.maxAttempts}) reached for ${operationName}`, { error: error.message });
        throw error;
      }

      if (timeElapsed >= config.maxWindowMs) {
        logger.error(`Max retry window (${config.maxWindowMs}ms) exceeded for ${operationName}`, { error: error.message });
        throw error;
      }

      // Calculate exponential backoff: baseDelay * 2^(attempt-1)
      const backoff = config.baseDelayMs * Math.pow(2, attempt - 1);
      
      // Add randomized jitter (up to 20% of the backoff)
      const jitter = Math.random() * (backoff * 0.2);
      const delay = Math.min(backoff + jitter, config.maxWindowMs - timeElapsed);

      if (delay <= 0) {
        throw error;
      }

      logger.info(`Transient error in ${operationName}, retrying (Attempt ${attempt + 1}/${config.maxAttempts}) in ${Math.round(delay)}ms`, { 
        error: error.message,
        code: error.code
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }
}
