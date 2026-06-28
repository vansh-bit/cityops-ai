import type { ToolRequest } from '../../reasoning';

export interface ToolMetadata {
  toolId: string;
  name: string;
  category: string;
  purpose: string;
  requiredInputs: string[];
  outputType: string;
  timeoutMs: number;
  availability: 'enabled' | 'disabled';
  version: string;
}

export interface RawToolResponse {
  success: boolean;
  type: string;
  payload?: Record<string, unknown>;
  error?: string;
}

export interface ExecutionContext {
  toolId: string;
  requestId: string;
  correlationId: string;
  startTime: number;
  timeoutMs: number;
}

export interface ITool {
  getMetadata(): ToolMetadata;
  execute(request: ToolRequest, context: ExecutionContext): Promise<RawToolResponse>;
}
