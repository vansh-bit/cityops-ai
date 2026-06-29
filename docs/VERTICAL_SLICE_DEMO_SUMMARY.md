# Vertical Slice Demo Summary (Engineering Validation)

## Overview

As part of the **Engineering Integration Validation** before proceeding to Milestone 5, a temporary Vertical Slice Demo was built. The purpose of this demo is to prove that the architecture defined in Milestones 1–4 actually produces the product we envisioned. 

This demo exercises the complete AI pipeline end-to-end without requiring persistent data, authentication, or complete dashboard UIs. It proves that:
1. The **AI Runtime** can execute reasoning loops based on visual perceptions.
2. The **Decision Engine** can correctly request additional evidence.
3. The **Tool Registry** correctly discovers and executes the Evidence tools.
4. The **Evidence Framework** correctly coordinates multiple external providers.
5. The **Confidence Engine** accurately evaluates the final decision against configured thresholds.

## Architecture Reuse

The demo was designed to reuse the **LOCKED** production architecture exactly as specified in the previous milestones. No mock implementations were used for core logic.

* **`RuntimeFactory`**: A new orchestration factory was created (`backend/src/ai/factory/RuntimeFactory.ts`). This factory instantiates the full production dependency graph for the AI Runtime, including the `DecisionEngine`, `ConfidenceEngine`, `ExecutionController`, and all `EvidenceProviders` (Maps, Vision, Municipal).
* **AI Client**: The demo executes using the real `GeminiClient` with the structured JSON schema defined in Phase 1.
* **Evidence Providers**: The demo invokes the real `EvidenceCoordinator` and `EvidenceToolAdapter`, which are capable of communicating with external APIs (if configured) or safely falling back to stub mode via the `STUB_MODE=true` environment flag.

## Demo Flow

The Vertical Slice Demo is accessible via a temporary frontend route (`/demo`) and communicates with a new backend endpoint (`POST /api/v1/demo/analyze`).

1. **Scenario Selection**: The developer selects one of three predefined scenarios (Pothole, Graffiti, Water Main Break). Each scenario preloads mock perception data (simulating a citizen's uploaded image and GPS data).
2. **Execution**: The frontend sends the perception data to the backend.
3. **AI Pipeline Processing**: The `RuntimeFactory` spins up the AI Coordinator, which takes the perception and begins iterating.
4. **Output Generation**: The pipeline returns a complete `RuntimeState` snapshot, including:
   * The final operational decision (Classification, Department, Priority).
   * The confidence evaluation and escalation recommendation.
   * Execution telemetry (latencies, tool invocations).
5. **Developer UI**: The frontend exposes a debug panel showing the structured output, proving the end-to-end functionality.

## Current Gaps & Limitations

Because this is a strict vertical slice for validation, several production requirements remain intentionally unimplemented:

* **Authentication & Authorization**: The demo endpoint is public.
* **Persistence**: The execution state and final decision are not saved to Firestore.
* **Citizen Workflow**: The UI does not mimic the actual citizen submission app; it simply injects a payload into the pipeline.
* **Real External Evidence Data**: Depending on the `.env` configuration on the machine running the demo, evidence providers may return stubbed data rather than real API results. 

## Conclusion

The architecture has proven sound. The pipeline successfully transforms a simple visual perception into a structured, municipality-ready work order recommendation, backed by deterministic evidence gathering and mathematically evaluated confidence scoring. The project is ready to proceed to Milestone 5.
