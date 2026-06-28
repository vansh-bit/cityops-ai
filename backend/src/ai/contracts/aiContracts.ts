import type { PromptId } from './promptContracts';

type AIContentPart =
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'fileUri';
      uri: string;
      mimeType: string;
    };

interface AIServiceRequest {
  promptId: PromptId;
  promptVersion?: string;
  traceId: string;
  requestId?: string;
  contents: AIContentPart[];
  responseMimeType?: 'application/json' | 'text/plain';
}

interface AIModelRequest extends AIServiceRequest {
  model: string;
  systemInstruction: string;
  timeoutMs: number;
}

interface AIUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

interface AIServiceResponse {
  promptId: PromptId;
  promptVersion: string;
  model: string;
  outputText: string;
  traceId: string;
  requestId?: string;
  latencyMs: number;
  usage?: AIUsageMetadata;
}

interface AIErrorContract {
  code: string;
  category: 'configuration' | 'gemini' | 'timeout' | 'validation' | 'parsing';
  message: string;
  retryable: boolean;
  details: string[];
}

export {
  type AIContentPart,
  type AIErrorContract,
  type AIModelRequest,
  type AIServiceRequest,
  type AIServiceResponse,
  type AIUsageMetadata,
};
