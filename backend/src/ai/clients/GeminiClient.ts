import { GoogleGenerativeAI, type Content, type GenerateContentResult, type Part } from '@google/generative-ai';
import { getGeminiClient } from '../../config/gemini';
import type { AIConfig } from '../config/aiConfig';
import type { AIContentPart, AIModelRequest, AIServiceResponse, AIUsageMetadata } from '../contracts';
import { AIGeminiError, AIParsingError, AITimeoutError } from '../exceptions';
import type { AILogger } from '../logging/aiLogger';
import type { AIMetricsCollector } from '../metrics/aiMetrics';

interface AIClient {
  generate(request: AIModelRequest): Promise<AIServiceResponse>;
}

interface GeminiClientDependencies {
  aiConfig: AIConfig;
  aiLogger: AILogger;
  metricsCollector: AIMetricsCollector;
  modelFactory?: GeminiModelFactory;
}

interface GeminiModelLike {
  generateContent(request: {
    contents: Content[];
    generationConfig?: {
      responseMimeType?: 'application/json' | 'text/plain';
    };
  }): Promise<GenerateContentResult>;
}

type GeminiModelFactory = (options: { model: string; systemInstruction: string }) => GeminiModelLike;

class GeminiClient implements AIClient {
  private readonly modelFactory: GeminiModelFactory;

  constructor(private readonly dependencies: GeminiClientDependencies) {
    this.modelFactory =
      dependencies.modelFactory ||
      ((options) =>
        getGeminiClient().getGenerativeModel({
          model: options.model,
          systemInstruction: options.systemInstruction,
        }));
  }

  async generate(request: AIModelRequest): Promise<AIServiceResponse> {
    const startedAt = Date.now();

    this.dependencies.aiLogger.logExecutionStarted({
      traceId: request.traceId,
      requestId: request.requestId,
      promptId: request.promptId,
      promptVersion: request.promptVersion,
      model: request.model,
    });

    try {
      const model = this.modelFactory({
        model: request.model,
        systemInstruction: request.systemInstruction,
      });

      const result = await withTimeout(
        model.generateContent({
          contents: [
            {
              role: 'user',
              parts: request.contents.map(mapContentPart),
            },
          ],
          generationConfig: request.responseMimeType
            ? { responseMimeType: request.responseMimeType }
            : undefined,
        }),
        request.timeoutMs,
      );

      const outputText = result.response.text();

      if (!outputText) {
        throw new AIParsingError('Gemini returned an empty response.');
      }

      const usage = mapUsageMetadata(result);
      const latencyMs = Date.now() - startedAt;

      this.dependencies.metricsCollector.recordExecution({
        traceId: request.traceId,
        durationMs: latencyMs,
        promptId: request.promptId,
        model: request.model,
      });

      if (usage?.totalTokenCount) {
        this.dependencies.metricsCollector.recordTokenUsage({
          traceId: request.traceId,
          promptId: request.promptId,
          model: request.model,
          totalTokenCount: usage.totalTokenCount,
        });
      }

      this.dependencies.aiLogger.logExecutionCompleted({
        traceId: request.traceId,
        requestId: request.requestId,
        promptId: request.promptId,
        promptVersion: request.promptVersion,
        model: request.model,
        durationMs: latencyMs,
        totalTokenCount: usage?.totalTokenCount,
      });

      return {
        promptId: request.promptId,
        promptVersion: request.promptVersion || this.dependencies.aiConfig.defaultPromptVersion,
        model: request.model,
        outputText,
        traceId: request.traceId,
        requestId: request.requestId,
        latencyMs,
        usage,
      };
    } catch (error) {
      const convertedError = convertGeminiError(error);

      this.dependencies.metricsCollector.recordFailure({
        traceId: request.traceId,
        promptId: request.promptId,
        model: request.model,
      });
      this.dependencies.aiLogger.logExecutionFailed(convertedError.message, {
        traceId: request.traceId,
        requestId: request.requestId,
        promptId: request.promptId,
        promptVersion: request.promptVersion,
        model: request.model,
        details: convertedError.details,
      });

      throw convertedError;
    }
  }
}

function mapContentPart(part: AIContentPart): Part {
  if (part.type === 'text') {
    return { text: part.text };
  }

  return {
    fileData: {
      fileUri: part.uri,
      mimeType: part.mimeType,
    },
  };
}

function mapUsageMetadata(result: GenerateContentResult): AIUsageMetadata | undefined {
  const usageMetadata = result.response.usageMetadata;

  if (!usageMetadata) {
    return undefined;
  }

  return {
    promptTokenCount: usageMetadata.promptTokenCount,
    candidatesTokenCount: usageMetadata.candidatesTokenCount,
    totalTokenCount: usageMetadata.totalTokenCount,
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutHandle: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new AITimeoutError(`Gemini request exceeded timeout of ${timeoutMs}ms.`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

function convertGeminiError(error: unknown): AIGeminiError | AIParsingError | AITimeoutError {
  if (error instanceof AITimeoutError || error instanceof AIParsingError) {
    return error;
  }

  if (error instanceof Error) {
    return new AIGeminiError(error.message);
  }

  return new AIGeminiError('Gemini request failed unexpectedly.');
}

function createGeminiClient(apiKey: string): GoogleGenerativeAI {
  return new GoogleGenerativeAI(apiKey);
}

export { createGeminiClient, GeminiClient, type AIClient, type GeminiModelFactory, type GeminiModelLike };
