import logger from '../../utils/logger';

interface AIExecutionLogContext {
  traceId: string;
  requestId?: string;
  promptId?: string;
  promptVersion?: string;
  model?: string;
  durationMs?: number;
  totalTokenCount?: number;
  details?: string[];
}

let currentAILogger: AILogger;

class AILogger {
  constructor(private readonly level: string) {}

  logExecutionStarted(context: AIExecutionLogContext): void {
    logger.info('AI execution started', {
      ...context,
      level: this.level,
      service: 'ai',
      event: 'execution_started',
    });
  }

  logExecutionCompleted(context: AIExecutionLogContext): void {
    logger.info('AI execution completed', {
      ...context,
      level: this.level,
      service: 'ai',
      event: 'execution_completed',
    });
  }

  logExecutionFailed(message: string, context: AIExecutionLogContext): void {
    logger.error('AI execution failed', {
      ...context,
      level: this.level,
      message,
      service: 'ai',
      event: 'execution_failed',
    });
  }
}

function getAILogger(): AILogger {
  if (!currentAILogger) {
    currentAILogger = new AILogger(process.env.LOG_LEVEL || 'info');
  }

  return currentAILogger;
}

export { AILogger, getAILogger, type AIExecutionLogContext };
