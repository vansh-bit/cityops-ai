import type { AIConfig } from '../config/aiConfig';
import type { AIServiceRequest, AIServiceResponse } from '../contracts';
import { AIValidationError } from '../exceptions';
import type { AILogger } from '../logging/aiLogger';
import type { AIClient } from '../clients/GeminiClient';
import type { IPromptManager } from '../prompts/PromptManager';

interface IAIService {
  generateResponse(request: AIServiceRequest): Promise<AIServiceResponse>;
}

interface AIServiceDependencies {
  aiClient: AIClient;
  aiConfig: AIConfig;
  aiLogger: AILogger;
  promptManager: IPromptManager;
}

class DefaultAIService implements IAIService {
  constructor(private readonly dependencies: AIServiceDependencies) {}

  async generateResponse(request: AIServiceRequest): Promise<AIServiceResponse> {
    validateAIServiceRequest(request);

    const prompt = this.dependencies.promptManager.resolvePrompt(request.promptId, request.promptVersion);

    return this.dependencies.aiClient.generate({
      ...request,
      promptVersion: prompt.version,
      model: this.dependencies.aiConfig.geminiModel,
      systemInstruction: prompt.systemInstruction,
      timeoutMs: this.dependencies.aiConfig.requestTimeoutMs,
    });
  }
}

function validateAIServiceRequest(request: AIServiceRequest): void {
  if (!request.traceId) {
    throw new AIValidationError('AI request must include a trace ID.');
  }

  if (request.contents.length === 0) {
    throw new AIValidationError('AI request must include at least one content part.');
  }

  for (const contentPart of request.contents) {
    if (contentPart.type === 'text' && !contentPart.text.trim()) {
      throw new AIValidationError('Text content parts must not be empty.');
    }

    if (contentPart.type === 'fileUri' && (!contentPart.uri || !contentPart.mimeType)) {
      throw new AIValidationError('File URI content parts must include both URI and MIME type.');
    }
  }
}

export { DefaultAIService, type AIServiceDependencies, type IAIService, validateAIServiceRequest };
