/**
 * Decision Engine — Internal Models
 *
 * All reasoning models used by the Decision Engine.
 * These models represent the complete reasoning context throughout execution.
 *
 * Architecture Reference:
 *   02_Decision_Engine.md §7, §8
 *   Chapter 5 §5.4.2, §5.5, §5.12, §5.13
 *
 * Constraints:
 *   - No Firestore dependencies
 *   - No confidence values (EC-05)
 *   - No tool execution logic
 *   - Models are deterministic, serializable, and structured
 */

// ── Perception Model (§8 — Perception Model) ──

/** Structured understanding received from the Vision Module. */
export interface PerceptionResult {
  /** Detected infrastructure issue type */
  detectedIssue: string;
  /** Initial severity estimate from vision */
  severityEstimate: string;
  /** Extracted visual observations */
  visualObservations: string[];
  /** Perception metadata */
  metadata: {
    imageRef: string;
    latitude: number;
    longitude: number;
    citizenDescription?: string;
    timestamp: string;
  };
}

// ── Reasoning Context (§8 — Reasoning Context) ──

/** Represents everything currently known during reasoning. */
export interface ReasoningContext {
  /** Facts confirmed through perception or evidence */
  confirmedFacts: string[];
  /** Assumptions made during reasoning */
  assumptions: string[];
  /** Remaining uncertainties to resolve */
  uncertainties: string[];
  /** Evidence requirements identified */
  evidenceRequirements: string[];
}

// ── Evidence Plan (§8 — Evidence Plan) ──

/** Represents a future evidence need. */
export interface EvidencePlan {
  /** Description of missing information */
  missingInformation: string;
  /** Tool required to obtain the evidence */
  requiredTool: string;
  /** Why this evidence is needed */
  justification: string;
  /** What the expected observation should contain */
  expectedObservation: string;
}

// ── Tool Request (§14 — Tool Request Generation) ──

/** Abstract request for tool execution. Decision Engine generates these; Runtime executes them. */
export interface ToolRequest {
  /** Unique identifier for this request */
  requestId: string;
  /** Tool to invoke */
  toolId: string;
  /** Reason for requesting this tool */
  reason: string;
  /** Inputs required by the tool */
  inputs: Record<string, unknown>;
  /** Expected observation description */
  expectedObservation: string;
  /** The reasoning step that originated this request */
  originatingStep: number;
  /** Timestamp of request creation */
  timestamp: string;
}

// ── Observation Model (§8 — Observation Model) ──

/** Represents structured evidence returned by external tools. */
export interface Observation {
  /** Unique identifier for this observation */
  observationId: string;
  /** Source tool that produced this observation */
  source: string;
  /** Type of observation */
  type: string;
  /** Observation data payload */
  payload: Record<string, unknown>;
  /** Retrieval status */
  status: 'success' | 'failure' | 'timeout' | 'partial';
  /** ID of the originating ToolRequest */
  requestId: string;
  /** Timestamp of observation receipt */
  timestamp: string;
}

// ── Decision Result (§18 — Decision Generation) ──

/**
 * Structured operational recommendation.
 * Does NOT contain confidence values (EC-05 — confidence belongs to Phase 4).
 */
export interface DecisionResult {
  /** Classified issue type */
  issueClassification: string;
  /** Recommended department */
  departmentRecommendation: string;
  /** Operational priority */
  priorityRecommendation: string;
  /** Structured reasoning explanation */
  reasoning: string;
  /** Summary of supporting evidence used */
  supportingEvidence: string[];
  /** Unresolved uncertainties remaining */
  unresolvedUncertainties: string[];
  /** Escalation recommendation (without confidence value) */
  escalationRecommendation: string;
  /** Timestamp of decision generation */
  timestamp: string;
}

// ── Reasoning History (§19 — Reasoning History) ──

/** Types of reasoning steps recorded in history. */
export type ReasoningStepType =
  | 'initial_reasoning'
  | 'evidence_requested'
  | 'observation_received'
  | 'reasoning_update'
  | 'stop_decision'
  | 'decision_generated'
  | 'error';

/** A single entry in the reasoning history. Append-only (INV-05). */
export interface ReasoningHistoryEntry {
  /** Type of reasoning step */
  stepType: ReasoningStepType;
  /** Human-readable description */
  description: string;
  /** The iteration during which this entry was created */
  iteration: number;
  /** Timestamp of the entry */
  timestamp: string;
  /** Optional metadata for this step */
  metadata?: Record<string, unknown>;
}

// ── Stop Reason (§17 — Stopping Controller) ──

/** Valid reasons for terminating reasoning. */
export enum StopReason {
  /** Sufficient evidence exists to make a recommendation */
  SUFFICIENT_EVIDENCE = 'SUFFICIENT_EVIDENCE',
  /** No unresolved uncertainty remains */
  NO_UNCERTAINTY = 'NO_UNCERTAINTY',
  /** Maximum tool invocation limit reached */
  MAX_ITERATIONS = 'MAX_ITERATIONS',
  /** No additional useful evidence can be obtained */
  NO_USEFUL_TOOLS = 'NO_USEFUL_TOOLS',
  /** Further reasoning would not materially improve the recommendation */
  IMMATERIAL_IMPROVEMENT = 'IMMATERIAL_IMPROVEMENT',
  /** Runtime safety limits require termination */
  SAFETY_LIMIT = 'SAFETY_LIMIT',
}

// ── Decision State (§7 — Decision State) ──

/**
 * Complete reasoning state throughout execution.
 * Single source of truth for reasoning (INV-01).
 * Only the Decision Engine may modify this state (INV-07).
 */
export interface DecisionState {
  /** Unique execution identifier */
  executionId: string;
  /** Original perception input */
  perception: PerceptionResult;
  /** Current reasoning context */
  reasoningContext: ReasoningContext;
  /** Evidence plans identified */
  evidencePlans: EvidencePlan[];
  /** Tool requests generated */
  toolRequests: ToolRequest[];
  /** Observations received */
  observations: Observation[];
  /** Complete reasoning history (append-only, INV-05) */
  reasoningHistory: ReasoningHistoryEntry[];
  /** Current iteration count (monotonically increasing, INV-04) */
  iterationCount: number;
  /** Whether reasoning has been stopped (irreversible, INV-06) */
  stopped: boolean;
  /** Reason for stopping, if stopped */
  stopReason: StopReason | null;
  /** Final decision result (set exactly once, INV-08) */
  decisionResult: DecisionResult | null;
  /** Execution start timestamp */
  startedAt: string;
  /** Execution end timestamp */
  completedAt: string | null;
}
