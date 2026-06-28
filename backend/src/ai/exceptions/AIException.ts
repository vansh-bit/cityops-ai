import type { AIErrorContract } from '../contracts';

class AIException extends Error {
  code: string;
  category: AIErrorContract['category'];
  retryable: boolean;
  details: string[];

  constructor(
    code: string,
    category: AIErrorContract['category'],
    message: string,
    retryable: boolean,
    details: string[] = [],
  ) {
    super(message);
    this.name = 'AIException';
    this.code = code;
    this.category = category;
    this.retryable = retryable;
    this.details = details;
  }

  toContract(): AIErrorContract {
    return {
      code: this.code,
      category: this.category,
      message: this.message,
      retryable: this.retryable,
      details: this.details,
    };
  }
}

class AIConfigurationError extends AIException {
  constructor(message: string, details: string[] = []) {
    super('AI_CONFIGURATION_ERROR', 'configuration', message, false, details);
    this.name = 'AIConfigurationError';
  }
}

class AIGeminiError extends AIException {
  constructor(message: string, details: string[] = []) {
    super('AI_GEMINI_ERROR', 'gemini', message, false, details);
    this.name = 'AIGeminiError';
  }
}

class AITimeoutError extends AIException {
  constructor(message: string, details: string[] = []) {
    super('AI_TIMEOUT_ERROR', 'timeout', message, true, details);
    this.name = 'AITimeoutError';
  }
}

class AIValidationError extends AIException {
  constructor(message: string, details: string[] = []) {
    super('AI_VALIDATION_ERROR', 'validation', message, false, details);
    this.name = 'AIValidationError';
  }
}

class AIParsingError extends AIException {
  constructor(message: string, details: string[] = []) {
    super('AI_PARSING_ERROR', 'parsing', message, false, details);
    this.name = 'AIParsingError';
  }
}

export {
  AIConfigurationError,
  AIException,
  AIGeminiError,
  AIParsingError,
  AITimeoutError,
  AIValidationError,
};
