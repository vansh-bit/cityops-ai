# 03_Evidence_Orchestration.md

# Phase 3 — Evidence Orchestration

---

# Phase Objective

Implement the orchestration layer responsible for coordinating multiple Evidence Providers and delivering a unified Evidence Package to the AI Runtime.

This phase completes the Evidence Collection Layer by integrating the infrastructure from Phase 1 and the providers from Phase 2 into the existing Runtime Coordinator and Tool Registry.

No reasoning, confidence evaluation, persistence, or business logic shall be implemented.

---

# Locked Context

The following components are already implemented and LOCKED.

## Milestone 1

* Infrastructure
* Repository
* Shared Workspace

---

## Milestone 2

* Authentication
* Authorization
* Cloud Infrastructure

---

## Milestone 3

* Runtime Coordinator
* Decision Engine
* Tool Registry
* Confidence Engine

---

## Milestone 4

Completed:

* Phase 1 – Evidence Infrastructure
* Phase 2 – Evidence Tools

These implementations shall not be redesigned.

---

# Scope

Implement only the orchestration layer.

---

## Evidence Coordinator

Responsibilities:

* Receive evidence requests
* Determine required providers
* Coordinate provider execution
* Collect provider responses
* Aggregate normalized evidence
* Return unified Evidence Package

The coordinator shall never perform reasoning.

---

## Provider Scheduling

Implement deterministic scheduling.

Responsibilities:

* Select providers
* Prevent duplicate execution
* Enforce execution ordering
* Track execution state

Scheduling must remain deterministic.

---

## Evidence Aggregation

Responsibilities:

* Merge normalized Evidence objects
* Preserve source metadata
* Preserve execution metadata
* Preserve timestamps
* Preserve validation status

Aggregation shall not modify evidence content.

---

## Runtime Integration

Integrate the Evidence Coordinator with the existing:

* Runtime Coordinator
* Tool Registry

The existing AI Runtime shall remain architecturally unchanged.

---

## Failure Handling

Implement:

* provider timeout handling
* partial evidence handling
* provider failure isolation
* retry policy (where specified)
* structured failure reporting

No provider failure shall terminate runtime execution.

---

## Logging

Capture:

* provider execution order
* execution duration
* aggregation events
* failures
* warnings
* completion status

---

## Metrics

Collect:

* provider latency
* orchestration duration
* provider success rate
* provider failure rate
* evidence count
* aggregation statistics

---

# Explicitly Out of Scope

Do NOT implement:

* Decision Engine changes
* Confidence Engine changes
* Firestore persistence
* Citizen workflow
* Authority dashboard
* Human Review
* Deployment
* Business workflows

---

# Expected Repository Structure

Recommended implementation:

```text
backend/src/evidence/

orchestration/
│
├── coordinator/
├── scheduler/
├── aggregation/
├── runtime/
├── failure/
└── tests/
```

Existing Phase 1 and Phase 2 folders remain unchanged.

---

# Component Responsibilities

## Evidence Coordinator

Coordinates provider execution.

Does not execute providers directly.

---

## Scheduler

Determines provider execution order.

Maintains deterministic behaviour.

---

## Aggregation

Produces unified Evidence Package.

Never modifies provider evidence.

---

## Runtime Integration

Connects the orchestration layer to the existing Runtime Coordinator.

Does not introduce runtime logic.

---

## Failure Manager

Handles:

* timeout
* cancellation
* partial evidence
* provider failures

Returns deterministic runtime responses.

---

# Runtime Behaviour

Execution flow:

```text
Runtime Coordinator

↓

Decision Engine

↓

Tool Registry

↓

Evidence Coordinator

↓

Provider Scheduler

↓

Evidence Providers

↓

Evidence Normalization

↓

Evidence Aggregation

↓

Unified Evidence Package

↓

Decision Engine

↓

Confidence Engine
```

The orchestration layer shall never bypass the Tool Registry.

The Decision Engine shall never communicate directly with providers.

---

# External Dependencies

No new provider libraries shall be introduced.

Only dependencies approved during Phase 2 may be used.

No infrastructure changes are permitted.

---

# Google Cloud

Google Cloud services remain unchanged.

This phase only coordinates previously implemented providers.

No new Google Cloud integrations shall be introduced.

---

# Acceptance Criteria

Phase 3 is complete when:

* Evidence Coordinator implemented.
* Provider Scheduler implemented.
* Evidence Aggregation implemented.
* Runtime integration completed.
* Failure handling implemented.
* Logging implemented.
* Metrics implemented.
* End-to-end runtime execution succeeds.
* Backend builds successfully.
* Frontend builds successfully.
* Shared workspace builds successfully.
* All tests pass.
* No architectural deviations exist.

---

# Testing Matrix

| Component           | Unit | Integration | Runtime |
| ------------------- | :--: | :---------: | :-----: |
| Coordinator         |   ✓  |      ✓      |    ✓    |
| Scheduler           |   ✓  |      ✓      |    ✓    |
| Aggregation         |   ✓  |      ✓      |    ✓    |
| Failure Handling    |   ✓  |      ✓      |    ✓    |
| Runtime Integration |   ✓  |      ✓      |    ✓    |
| Logging             |   ✓  |      ✓      |    ✓    |
| Metrics             |   ✓  |      ✓      |    ✓    |

---

# Failure Matrix

Validate behaviour for:

* Provider timeout
* Multiple provider failures
* Partial evidence availability
* Invalid normalized evidence
* Aggregation failure
* Scheduler failure
* Runtime cancellation
* Unexpected exceptions
* Missing provider configuration
* Duplicate provider execution

Every failure shall return a deterministic response.

---

# Common Implementation Mistakes

Avoid:

* Calling providers directly from the Runtime Coordinator
* Performing reasoning in the orchestration layer
* Modifying evidence during aggregation
* Bypassing the Tool Registry
* Ignoring provider failures
* Tight coupling between providers
* Business logic in the coordinator
* Firestore integration
* Confidence calculations

---

# Deliverables

Implement:

* Evidence Coordinator
* Provider Scheduler
* Evidence Aggregation
* Runtime Integration
* Failure Handling
* Logging
* Metrics
* End-to-End Tests

Nothing else.

---

# Engineering Brief

The objective of Phase 3 is to transform independent Evidence Providers into a cohesive Evidence Collection Layer that seamlessly integrates with the existing AI Runtime.

The orchestration layer coordinates execution without altering provider behaviour or AI reasoning.

Maintain strict separation between:

* orchestration,
* provider execution,
* reasoning,
* confidence evaluation.

---

# Verification

Before completion verify:

* Backend builds
* Frontend builds
* Shared workspace builds
* Runtime integration succeeds
* Provider orchestration succeeds
* Aggregation succeeds
* End-to-end evidence flow succeeds
* Tests pass
* Lint passes
* Formatting passes

---

# Review Deliverable

Generate:

```text
docs/
└── Reviews/
    └── Milestone4/
        └── Phase3/
            IMPLEMENTATION_REVIEW_PACKAGE.md
```

The review package shall summarize:

* Files created
* Files modified
* Orchestration components
* Runtime integration
* Aggregation
* Failure handling
* Logging
* Metrics
* Tests executed
* Known issues
* Architectural deviations

If none exist, explicitly state:

> No architectural deviations.

---

# Milestone Completion

Upon successful completion of Phase 3, also generate:

```text
docs/
└── Reviews/
    └── Milestone4/
        └── MILESTONE4_IMPLEMENTATION_SUMMARY.md
```

This summary shall include:

* Executive Summary
* Phase 1 completion
* Phase 2 completion
* Phase 3 completion
* End-to-end verification
* Testing summary
* Known issues
* Architecture compliance
* Ready for Milestone 5 (YES/NO)

---

# Stop Condition

When:

* All acceptance criteria are satisfied
* End-to-end verification passes
* Phase 3 IMPLEMENTATION_REVIEW_PACKAGE.md has been generated
* MILESTONE4_IMPLEMENTATION_SUMMARY.md has been generated

STOP.

Do **NOT** begin Milestone 5.

Wait for the final technical review and architectural approval of Milestone 4.
