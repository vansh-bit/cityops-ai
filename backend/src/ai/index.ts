import type { AppConfig } from '../config';
import { GeminiClient, type AIClient } from './clients/GeminiClient';
import { initializeAIConfig, getAIConfig } from './config/aiConfig';
import { AILogger, getAILogger } from './logging/aiLogger';
import { InMemoryAIMetricsCollector, getAIMetricsCollector, initializeAIMetricsCollector } from './metrics/aiMetrics';
import { PromptLoader } from './prompts/PromptLoader';
import { InMemoryPromptRepository, type PromptRepository } from './prompts/PromptRepository';
import { PromptManager, type IPromptManager } from './prompts/PromptManager';
import { DefaultAIService, type IAIService } from './services/AIService';
import {
  DecisionEngine,
  DecisionGenerator,
  DecisionStateManager,
  EvidencePlanner,
  InitialReasoning,
  ObservationProcessor,
  StoppingController,
  type IDecisionEngine,
} from './reasoning';

let aiService: IAIService;
let aiClient: AIClient;
let promptRepository: PromptRepository;
let promptManager: IPromptManager;
let decisionEngine: IDecisionEngine;

async function initializeAIInfrastructure(config: AppConfig): Promise<void> {
  initializeAIConfig(config);

  const aiConfig = getAIConfig();
  const aiLogger = new AILogger(config.logLevel);
  initializeAIMetricsCollector(new InMemoryAIMetricsCollector());

  const promptLoader = new PromptLoader({
    definitionsPath: aiConfig.promptDefinitionsPath,
  });
  const prompts = await promptLoader.loadPrompts();

  promptRepository = new InMemoryPromptRepository(prompts);
  promptManager = new PromptManager({
    promptRepository,
    defaultPromptVersion: aiConfig.defaultPromptVersion,
  });
  aiClient = new GeminiClient({
    aiConfig,
    aiLogger,
    metricsCollector: getAIMetricsCollector(),
  });
  aiService = new DefaultAIService({
    aiClient,
    aiConfig,
    aiLogger,
    promptManager,
  });

  const stateManager = new DecisionStateManager();
  const initialReasoning = new InitialReasoning({ aiService, aiLogger });
  const evidencePlanner = new EvidencePlanner({ aiService, aiLogger });
  const observationProcessor = new ObservationProcessor({ aiService, aiLogger, stateManager });
  const stoppingController = new StoppingController({ aiLogger });
  const decisionGenerator = new DecisionGenerator({ aiService, aiLogger });

  decisionEngine = new DecisionEngine({
    aiLogger,
    stateManager,
    initialReasoning,
    evidencePlanner,
    observationProcessor,
    stoppingController,
    decisionGenerator,
  });
}

function getAIService(): IAIService {
  if (!aiService) {
    throw new Error('AI infrastructure has not been initialized. Call initializeAIInfrastructure() first.');
  }

  return aiService;
}

function getAIClient(): AIClient {
  if (!aiClient) {
    throw new Error('AI infrastructure has not been initialized. Call initializeAIInfrastructure() first.');
  }

  return aiClient;
}

function getPromptRepository(): PromptRepository {
  if (!promptRepository) {
    throw new Error('AI infrastructure has not been initialized. Call initializeAIInfrastructure() first.');
  }

  return promptRepository;
}

function getPromptManager(): IPromptManager {
  if (!promptManager) {
    throw new Error('AI infrastructure has not been initialized. Call initializeAIInfrastructure() first.');
  }

  return promptManager;
}

function getDecisionEngine(): IDecisionEngine {
  if (!decisionEngine) {
    throw new Error('AI infrastructure has not been initialized. Call initializeAIInfrastructure() first.');
  }

  return decisionEngine;
}

export {
  getAIClient,
  getAILogger,
  getAIService,
  getAIMetricsCollector,
  getPromptManager,
  getPromptRepository,
  getDecisionEngine,
  initializeAIInfrastructure,
};
