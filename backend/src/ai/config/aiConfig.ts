import path from 'path';
import type { AppConfig } from '../../config';

interface AIConfig {
  geminiModel: string;
  requestTimeoutMs: number;
  defaultPromptVersion: string;
  promptDefinitionsPath: string;
}

let currentAIConfig: AIConfig;

function initializeAIConfig(config: AppConfig): void {
  if (!Number.isInteger(config.ai.requestTimeoutMs) || config.ai.requestTimeoutMs <= 0) {
    throw new Error('AI_REQUEST_TIMEOUT_MS must be a positive integer.');
  }

  currentAIConfig = {
    geminiModel: config.ai.geminiModel,
    requestTimeoutMs: config.ai.requestTimeoutMs,
    defaultPromptVersion: config.ai.defaultPromptVersion,
    promptDefinitionsPath:
      config.ai.promptDefinitionsPath ||
      path.resolve(__dirname, '../prompts/definitions'),
  };
}

function getAIConfig(): AIConfig {
  if (!currentAIConfig) {
    throw new Error('AI configuration has not been initialized. Call initializeAIConfig() first.');
  }

  return currentAIConfig;
}

export { getAIConfig, initializeAIConfig, type AIConfig };
