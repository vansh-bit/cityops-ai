import { DecisionResult } from '../../reasoning/models/decisionModels';
import { ConfidenceMetadata } from '../../confidence/models/confidenceModels';

export enum RuntimeStatus {
  INITIALIZED = 'INITIALIZED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface RuntimeState {
  runtimeId: string;
  correlationId: string;
  status: RuntimeStatus;
  currentIteration: number;
  toolExecutions: number;
  startTime: string;
  endTime: string | null;
  failureStatus: string | null;
}

export interface FinalAIResponse {
  correlationId: string;
  runtimeId: string;
  status: RuntimeStatus;
  decision: DecisionResult | null;
  confidence: ConfidenceMetadata | null;
  evidence?: any[];
  runtimeMetadata: {
    durationMs: number;
    iterations: number;
    toolExecutions: number;
  };
  failureDetails?: {
    message: string;
    isRecoverable: boolean;
  };
}

export class RuntimeExecutionError extends Error {
  constructor(message: string, public readonly isRecoverable: boolean = false) {
    super(message);
    this.name = 'RuntimeExecutionError';
  }
}
