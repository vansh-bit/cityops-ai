import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import type { GenerateContentResult } from '@google/generative-ai';
import { GeminiClient } from '../ai/clients/GeminiClient';
import type { AIModelRequest, PromptDefinition } from '../ai/contracts';
import {
  AIConfigurationError,
  AIParsingError,
  AITimeoutError,
  AIValidationError,
} from '../ai/exceptions';
import { AILogger } from '../ai/logging/aiLogger';
import { InMemoryAIMetricsCollector } from '../ai/metrics/aiMetrics';
import { PromptLoader } from '../ai/prompts/PromptLoader';
import { PromptManager } from '../ai/prompts/PromptManager';
import { InMemoryPromptRepository } from '../ai/prompts/PromptRepository';
import { DefaultAIService } from '../ai/services/AIService';

describe('GeminiClient', () => {
  const metricsCollector = new InMemoryAIMetricsCollector();
  const aiLogger = new AILogger('info');
  const baseRequest: AIModelRequest = {
    promptId: 'vision',
    promptVersion: '1.0.0',
    traceId: 'trace-123',
    requestId: 'request-123',
    model: 'gemini-test',
    systemInstruction: 'Return structured output only.',
    timeoutMs: 100,
    contents: [
      {
        type: 'text',
        text: 'Analyze this image.',
      },
    ],
    responseMimeType: 'application/json',
  };

  it('formats requests for Gemini and maps responses', async () => {
    const generateContent = jest.fn().mockResolvedValue(mockGenerateContentResult('{"status":"ok"}'));
    const client = new GeminiClient({
      aiConfig: {
        geminiModel: 'gemini-test',
        requestTimeoutMs: 100,
        defaultPromptVersion: '1.0.0',
        promptDefinitionsPath: '/tmp/prompts',
      },
      aiLogger,
      metricsCollector,
      modelFactory: () => ({
        generateContent,
      }),
    });

    const response = await client.generate(baseRequest);

    expect(generateContent).toHaveBeenCalledWith({
      contents: [
        {
          role: 'user',
          parts: [{ text: 'Analyze this image.' }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });
    expect(response.outputText).toBe('{"status":"ok"}');
    expect(response.usage?.totalTokenCount).toBe(13);
  });

  it('converts timeouts into standardized timeout errors', async () => {
    const client = new GeminiClient({
      aiConfig: {
        geminiModel: 'gemini-test',
        requestTimeoutMs: 1,
        defaultPromptVersion: '1.0.0',
        promptDefinitionsPath: '/tmp/prompts',
      },
      aiLogger,
      metricsCollector,
      modelFactory: () => ({
        generateContent: () => new Promise<GenerateContentResult>(() => undefined),
      }),
    });

    await expect(
      client.generate({
        ...baseRequest,
        timeoutMs: 1,
      }),
    ).rejects.toBeInstanceOf(AITimeoutError);
  });

  it('converts empty model responses into parsing errors', async () => {
    const client = new GeminiClient({
      aiConfig: {
        geminiModel: 'gemini-test',
        requestTimeoutMs: 100,
        defaultPromptVersion: '1.0.0',
        promptDefinitionsPath: '/tmp/prompts',
      },
      aiLogger,
      metricsCollector,
      modelFactory: () => ({
        generateContent: jest.fn().mockResolvedValue(mockGenerateContentResult('')),
      }),
    });

    await expect(client.generate(baseRequest)).rejects.toBeInstanceOf(AIParsingError);
  });
});

describe('DefaultAIService', () => {
  const prompt: PromptDefinition = {
    id: 'vision',
    version: '1.0.0',
    responsibility: 'visual-understanding',
    description: 'Vision prompt',
    systemInstruction: 'Structured output only.',
    outputSchema: 'vision.v1',
    metadata: {
      owner: 'engineering',
      reviewed: true,
      lastUpdated: '2026-06-28',
    },
  };
  const repository = new InMemoryPromptRepository([prompt]);
  const promptManager = new PromptManager({
    promptRepository: repository,
    defaultPromptVersion: '1.0.0',
  });

  it('validates requests before calling the AI client', async () => {
    const aiService = new DefaultAIService({
      aiClient: {
        generate: jest.fn(),
      },
      aiConfig: {
        geminiModel: 'gemini-test',
        requestTimeoutMs: 5000,
        defaultPromptVersion: '1.0.0',
        promptDefinitionsPath: '/tmp/prompts',
      },
      aiLogger: new AILogger('info'),
      promptManager,
    });

    await expect(
      aiService.generateResponse({
        promptId: 'vision',
        traceId: '',
        contents: [],
      }),
    ).rejects.toBeInstanceOf(AIValidationError);
  });

  it('maps prompt metadata into the Gemini request', async () => {
    const generate = jest.fn().mockResolvedValue({
      promptId: 'vision',
      promptVersion: '1.0.0',
      model: 'gemini-test',
      outputText: '{"status":"ok"}',
      traceId: 'trace-1',
      latencyMs: 11,
    });
    const aiService = new DefaultAIService({
      aiClient: {
        generate,
      },
      aiConfig: {
        geminiModel: 'gemini-test',
        requestTimeoutMs: 5000,
        defaultPromptVersion: '1.0.0',
        promptDefinitionsPath: '/tmp/prompts',
      },
      aiLogger: new AILogger('info'),
      promptManager,
    });

    await aiService.generateResponse({
      promptId: 'vision',
      traceId: 'trace-1',
      contents: [{ type: 'text', text: 'Describe visible damage.' }],
    });

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-test',
        systemInstruction: 'Structured output only.',
        promptVersion: '1.0.0',
      }),
    );
  });
});

describe('Prompt infrastructure', () => {
  it('loads prompt definitions from disk', async () => {
    const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'cityops-prompts-'));
    const promptFilePath = path.join(tempDirectory, 'vision.1.0.0.json');

    await fs.writeFile(
      promptFilePath,
      JSON.stringify({
        id: 'vision',
        version: '1.0.0',
        responsibility: 'visual-understanding',
        description: 'Vision prompt',
        systemInstruction: 'Return JSON.',
        outputSchema: 'vision.v1',
        metadata: {
          owner: 'engineering',
          reviewed: true,
          lastUpdated: '2026-06-28',
        },
      }),
    );

    const loader = new PromptLoader({ definitionsPath: tempDirectory });
    const prompts = await loader.loadPrompts();

    expect(prompts).toHaveLength(1);
    expect(prompts[0].id).toBe('vision');
  });

  it('rejects invalid prompt definitions', async () => {
    const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'cityops-prompts-invalid-'));
    const promptFilePath = path.join(tempDirectory, 'vision.invalid.json');

    await fs.writeFile(
      promptFilePath,
      JSON.stringify({
        id: 'vision',
        version: 'invalid',
        systemInstruction: 'Return JSON.',
        outputSchema: 'vision.v1',
      }),
    );

    const loader = new PromptLoader({ definitionsPath: tempDirectory });

    await expect(loader.loadPrompts()).rejects.toBeInstanceOf(AIParsingError);
  });

  it('supports repository lookup and version selection', () => {
    const prompts: PromptDefinition[] = [
      {
        id: 'vision',
        version: '1.0.0',
        responsibility: 'visual-understanding',
        description: 'Vision prompt',
        systemInstruction: 'Return JSON.',
        outputSchema: 'vision.v1',
        metadata: { owner: 'engineering', reviewed: true, lastUpdated: '2026-06-28' },
      },
      {
        id: 'vision',
        version: '1.1.0',
        responsibility: 'visual-understanding',
        description: 'Vision prompt v1.1.0',
        systemInstruction: 'Return JSON v1.1.0.',
        outputSchema: 'vision.v1',
        metadata: { owner: 'engineering', reviewed: true, lastUpdated: '2026-06-28' },
      },
    ];
    const repository = new InMemoryPromptRepository(prompts);
    const promptManager = new PromptManager({
      promptRepository: repository,
      defaultPromptVersion: '1.1.0',
    });

    expect(repository.listVersions('vision')).toEqual(['1.0.0', '1.1.0']);
    expect(promptManager.resolvePrompt('vision').version).toBe('1.1.0');
    expect(promptManager.resolvePrompt('vision', '1.0.0').version).toBe('1.0.0');
  });
});

describe('AI exceptions and metrics scaffolding', () => {
  it('produces structured error contracts', () => {
    const error = new AIConfigurationError('Missing AI configuration.');

    expect(error.toContract()).toEqual({
      code: 'AI_CONFIGURATION_ERROR',
      category: 'configuration',
      message: 'Missing AI configuration.',
      retryable: false,
      details: [],
    });
  });

  it('collects execution metrics', () => {
    const collector = new InMemoryAIMetricsCollector();

    collector.recordExecution({
      traceId: 'trace-1',
      durationMs: 100,
      promptId: 'vision',
      model: 'gemini-test',
    });
    collector.recordFailure({
      traceId: 'trace-2',
      promptId: 'decision',
      model: 'gemini-test',
    });

    const snapshot = collector.getSnapshot();

    expect(snapshot.totalExecutions).toBe(1);
    expect(snapshot.totalFailures).toBe(1);
    expect(snapshot.averageLatencyMs).toBe(100);
  });
});

function mockGenerateContentResult(text: string): GenerateContentResult {
  return {
    response: {
      text: () => text,
      usageMetadata: {
        promptTokenCount: 5,
        candidatesTokenCount: 8,
        totalTokenCount: 13,
      },
    },
  } as GenerateContentResult;
}
