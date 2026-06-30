import { RuntimeCoordinator } from '../runtime/RuntimeCoordinator';
import { ExecutionController } from '../runtime/ExecutionController';
import { ResponseBuilder } from '../runtime/ResponseBuilder';
import { FailureCoordinator } from '../runtime/FailureCoordinator';
import { RuntimeLogger } from '../runtime/RuntimeLogger';
import { RuntimeMetrics } from '../runtime/RuntimeMetrics';
import { ConfidenceEngine } from '../confidence/ConfidenceEngine';
import { EvidenceEvaluator } from '../confidence/EvidenceEvaluator';
import { ReasoningEvaluator } from '../confidence/ReasoningEvaluator';
import { ThresholdEvaluator } from '../confidence/ThresholdEvaluator';
import { ReviewEvaluator } from '../confidence/ReviewEvaluator';
import { ConfidenceLogger } from '../confidence/ConfidenceLogger';

import { DecisionEngine } from '../reasoning/DecisionEngine';
import { DecisionStateManager } from '../reasoning/DecisionStateManager';
import { InitialReasoning } from '../reasoning/InitialReasoning';
import { EvidencePlanner } from '../reasoning/EvidencePlanner';
import { ObservationProcessor } from '../reasoning/ObservationProcessor';
import { StoppingController } from '../reasoning/StoppingController';
import { DecisionGenerator } from '../reasoning/DecisionGenerator';
import { AILogger } from '../logging/aiLogger';
import { ToolDispatcher } from '../../tools/registry/ToolDispatcher';
import { ToolRegistry } from '../../tools/registry/ToolRegistry';
import { ToolValidator } from '../../tools/registry/ToolValidator';
import { ToolResponseMapper } from '../../tools/registry/ToolResponseMapper';
import { ExecutionMonitor } from '../../tools/registry/ExecutionMonitor';
import { IterationCoordinator } from '../runtime/IterationCoordinator';
import { EvidenceToolAdapter } from '../../evidence/orchestration/runtime/EvidenceToolAdapter';
import { EvidenceCoordinator } from '../../evidence/orchestration/coordinator/EvidenceCoordinator';
import { EvidenceFramework } from '../../evidence/framework/EvidenceFramework';
import { GoogleMapsProvider } from '../../evidence/providers/maps/GoogleMapsProvider';
import { VisionProvider } from '../../evidence/providers/vision/VisionProvider';
import { MunicipalProvider } from '../../evidence/providers/municipal/MunicipalProvider';

import { DefaultAIService } from '../services/AIService';
import { GeminiClient } from '../clients/GeminiClient';
import { getAIConfig } from '../config/aiConfig';
import { PromptManager } from '../prompts/PromptManager';
import { PromptLoader } from '../prompts/PromptLoader';
import { InMemoryPromptRepository } from '../prompts/PromptRepository';
import { getAIMetricsCollector } from '../metrics/aiMetrics';

export class RuntimeFactory {
  static async create(): Promise<RuntimeCoordinator> {
    const aiLogger = new AILogger('RuntimeFactory');
    const metricsCollector = getAIMetricsCollector();

    // Dependencies
    const aiConfig = getAIConfig();
    const aiClient = new GeminiClient({ aiConfig, aiLogger, metricsCollector });
    
    const promptLoader = new PromptLoader();
    const prompts = await promptLoader.loadPrompts();
    const promptRepository = new InMemoryPromptRepository(prompts);
    const promptManager = new PromptManager({ promptRepository, defaultPromptVersion: aiConfig.defaultPromptVersion });
    
    const aiService = new DefaultAIService({ aiClient, aiConfig, aiLogger, promptManager });

    // Providers
    const framework = new EvidenceFramework();
    const googleMapsProvider = new GoogleMapsProvider();
    const visionProvider = new VisionProvider(framework);
    const municipalProvider = new MunicipalProvider(framework);
    
    // Evidence Orchestration
    const evidenceCoordinator = new EvidenceCoordinator([
      googleMapsProvider,
      visionProvider,
      municipalProvider
    ]);
    const evidenceToolAdapter = new EvidenceToolAdapter(evidenceCoordinator);

    // Tools
    const toolRegistry = new ToolRegistry();
    toolRegistry.registerTool(evidenceToolAdapter);
    
    const toolValidator = new ToolValidator();
    const toolResponseMapper = new ToolResponseMapper();
    const executionMonitor = new ExecutionMonitor(aiLogger);

    const toolDispatcher = new ToolDispatcher(
      toolRegistry,
      toolValidator,
      toolResponseMapper,
      executionMonitor,
      aiLogger
    );

    // Reasoning Engine
    const stateManager = new DecisionStateManager();
    const initialReasoning = new InitialReasoning({ aiService, aiLogger });
    const evidencePlanner = new EvidencePlanner({ aiService, aiLogger });
    const observationProcessor = new ObservationProcessor({ aiService, aiLogger, stateManager });
    const stoppingController = new StoppingController({ aiLogger, maxIterations: 3 });
    const decisionGenerator = new DecisionGenerator({ aiService, aiLogger });
    
    const decisionEngine = new DecisionEngine({
      aiLogger,
      stateManager,
      initialReasoning,
      evidencePlanner,
      observationProcessor,
      stoppingController,
      decisionGenerator
    });

    // Confidence Engine
    const confidenceLogger = new ConfidenceLogger(aiLogger);
    const confidenceEngine = new ConfidenceEngine(
      new EvidenceEvaluator(),
      new ReasoningEvaluator(),
      new ThresholdEvaluator({ highThreshold: 80, mediumThreshold: 50 }),
      new ReviewEvaluator(),
      confidenceLogger
    );

    // Runtime
    const runtimeLogger = new RuntimeLogger(aiLogger);
    const iterationCoordinator = new IterationCoordinator({ maxIterations: 3 }, runtimeLogger);
    const executionController = new ExecutionController(
      decisionEngine,
      toolDispatcher,
      iterationCoordinator
    );
    
    const responseBuilder = new ResponseBuilder();
    const failureCoordinator = new FailureCoordinator();
    const runtimeMetrics = new RuntimeMetrics();

    return new RuntimeCoordinator(
      executionController,
      confidenceEngine,
      responseBuilder,
      failureCoordinator,
      runtimeLogger,
      runtimeMetrics
    );
  }
}
