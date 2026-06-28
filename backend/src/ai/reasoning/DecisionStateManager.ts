import { randomUUID } from 'crypto';
import type {
  DecisionResult,
  DecisionState,
  EvidencePlan,
  Observation,
  PerceptionResult,
  ReasoningContext,
  ReasoningHistoryEntry,
  StopReason,
  ToolRequest,
} from './models';

export interface IDecisionStateManager {
  createState(perception: PerceptionResult): DecisionState;
  updateReasoningContext(state: DecisionState, context: ReasoningContext): DecisionState;
  addEvidencePlans(state: DecisionState, plans: EvidencePlan[]): DecisionState;
  addToolRequest(state: DecisionState, request: ToolRequest): DecisionState;
  addObservation(state: DecisionState, observation: Observation): DecisionState;
  addReasoningEntry(state: DecisionState, entry: Omit<ReasoningHistoryEntry, 'iteration' | 'timestamp'>): DecisionState;
  incrementIteration(state: DecisionState): DecisionState;
  markStopped(state: DecisionState, reason: StopReason): DecisionState;
  setDecisionResult(state: DecisionState, result: DecisionResult): DecisionState;
  validateState(state: DecisionState): void;
}

export class DecisionStateManager implements IDecisionStateManager {
  createState(perception: PerceptionResult): DecisionState {
    const now = new Date().toISOString();
    return {
      executionId: randomUUID(),
      perception,
      reasoningContext: {
        confirmedFacts: [],
        assumptions: [],
        uncertainties: [],
        evidenceRequirements: [],
      },
      evidencePlans: [],
      toolRequests: [],
      observations: [],
      reasoningHistory: [],
      iterationCount: 0,
      stopped: false,
      stopReason: null,
      decisionResult: null,
      startedAt: now,
      completedAt: null,
    };
  }

  updateReasoningContext(state: DecisionState, context: ReasoningContext): DecisionState {
    this.ensureNotStopped(state);
    return {
      ...state,
      reasoningContext: context,
    };
  }

  addEvidencePlans(state: DecisionState, plans: EvidencePlan[]): DecisionState {
    this.ensureNotStopped(state);
    return {
      ...state,
      evidencePlans: [...state.evidencePlans, ...plans],
    };
  }

  addToolRequest(state: DecisionState, request: ToolRequest): DecisionState {
    this.ensureNotStopped(state);
    return {
      ...state,
      toolRequests: [...state.toolRequests, request],
    };
  }

  addObservation(state: DecisionState, observation: Observation): DecisionState {
    this.ensureNotStopped(state);
    
    // INV-02: Every observation originates from a Tool Request
    if (!state.toolRequests.some(req => req.requestId === observation.requestId)) {
      throw new Error(`Observation references unknown Tool Request ID: ${observation.requestId}`);
    }

    return {
      ...state,
      observations: [...state.observations, observation],
    };
  }

  addReasoningEntry(
    state: DecisionState,
    entry: Omit<ReasoningHistoryEntry, 'iteration' | 'timestamp'>,
  ): DecisionState {
    const newEntry: ReasoningHistoryEntry = {
      ...entry,
      iteration: state.iterationCount,
      timestamp: new Date().toISOString(),
    };
    // INV-05: Reasoning history remains append-only
    return {
      ...state,
      reasoningHistory: [...state.reasoningHistory, newEntry],
    };
  }

  incrementIteration(state: DecisionState): DecisionState {
    this.ensureNotStopped(state);
    // INV-04: Iteration counter is monotonically increasing
    return {
      ...state,
      iterationCount: state.iterationCount + 1,
    };
  }

  markStopped(state: DecisionState, reason: StopReason): DecisionState {
    // INV-06: Stopping decisions are irreversible
    if (state.stopped) {
      return state; // Already stopped
    }
    return {
      ...state,
      stopped: true,
      stopReason: reason,
      completedAt: new Date().toISOString(),
    };
  }

  setDecisionResult(state: DecisionState, result: DecisionResult): DecisionState {
    // INV-08: Decision generation occurs exactly once
    if (state.decisionResult) {
      throw new Error('Decision result has already been set. (INV-08)');
    }
    return {
      ...state,
      decisionResult: result,
    };
  }

  validateState(state: DecisionState): void {
    if (!state) {
      throw new Error('Decision state is null or undefined (INV-01)');
    }
    if (!state.executionId) {
      throw new Error('Decision state missing executionId (INV-01)');
    }
    if (!state.perception) {
      throw new Error('Decision state missing perception (INV-01)');
    }

    // INV-02: Every observation originates from a Tool Request
    for (const obs of state.observations) {
      if (!state.toolRequests.some(req => req.requestId === obs.requestId)) {
        throw new Error(`Observation references unknown Tool Request ID: ${obs.requestId} (INV-02)`);
      }
    }

    // INV-03: Every Tool Request has explicit justification
    for (const req of state.toolRequests) {
      if (!req.reason || req.reason.trim() === '') {
        throw new Error(`Tool request ${req.requestId} missing justification (INV-03)`);
      }
    }
  }

  private ensureNotStopped(state: DecisionState): void {
    if (state.stopped) {
      throw new Error('Cannot mutate state after reasoning has stopped (INV-06)');
    }
  }
}
