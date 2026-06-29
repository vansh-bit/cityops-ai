# 02_Evidence_Tools.md

# Phase 2 — Evidence Tools

---

# Phase Objective

Implement the deterministic Evidence Providers responsible for collecting contextual information from approved external services.

This phase transforms raw external responses into standardized Evidence objects defined during Phase 1.

Evidence providers shall remain independent, reusable, and replaceable.

No orchestration or reasoning shall be implemented during this phase.

---

# Locked Context

The following components are already implemented and LOCKED:

* AI Runtime
* Runtime Coordinator
* Decision Engine
* Tool Registry
* Confidence Engine
* Evidence Infrastructure (Phase 1)

Phase 2 extends the Evidence Layer without modifying these components.

---

# Scope

Implement only the approved Evidence Providers.

---

## Google Maps Provider

Responsibilities:

* Reverse Geocoding
* Location Validation
* Administrative Area Lookup
* Nearby Roads
* Nearby Landmarks
* Geographic Context

The provider shall return only normalized Evidence objects.

---

## Vision Provider

Responsibilities:

* Image preprocessing
* Vision API invocation
* Observation extraction
* Structured response parsing
* Metadata generation

The provider shall not perform reasoning.

---

## Municipal Provider

Responsibilities:

Provide contextual municipal information required by the AI Runtime.

Examples include:

* civic asset metadata
* department reference data
* approved lookup services

Only providers defined by the architecture may be implemented.

---

## Evidence Adapters

Each provider shall expose a dedicated adapter.

Responsibilities:

* request translation
* response parsing
* schema normalization
* provider isolation

Adapters shall completely encapsulate provider-specific implementation details.

---

## Evidence Normalization

Normalize all provider responses into the common Evidence model.

Responsibilities:

* schema conversion
* metadata enrichment
* timestamp generation
* source identification
* validation

No provider-specific objects shall leave the adapter layer.

---

# Explicitly Out of Scope

Do NOT implement:

* Evidence orchestration
* Runtime coordination
* Decision Engine modifications
* Confidence evaluation
* Firestore
* Report lifecycle
* Citizen workflow
* Authority dashboard
* Deployment

---

# Expected Repository Structure

Recommended implementation:

```text
backend/src/evidence/

providers/
│
├── maps/
├── vision/
└── municipal/

adapters/
normalization/
tests/
```

Each provider must remain isolated.

Shared functionality belongs in Phase 1 infrastructure.

---

# Component Responsibilities

## Maps Provider

Collect geographical evidence.

Never perform reasoning.

---

## Vision Provider

Collect visual observations.

Return structured evidence only.

---

## Municipal Provider

Collect approved municipal context.

No business logic.

---

## Adapters

Hide provider implementation.

Provide deterministic interfaces.

---

## Normalization Layer

Convert provider output into standardized Evidence objects.

Guarantee schema consistency.

---

# Runtime Behaviour

Provider execution remains independent.

Execution flow:

```text
Evidence Request

↓

Provider Adapter

↓

External Service

↓

Raw Response

↓

Normalization

↓

Validation

↓

Evidence Object
```

Providers do not communicate with one another.

Providers do not communicate with the Runtime Coordinator directly.

---

# External Dependencies

Approved external services include:

* Google Maps Platform
* Gemini Vision (through approved AI interfaces)
* Approved municipal data services

No additional third-party providers may be introduced without architectural approval.

---

# Google Cloud Integration

Configuration shall use environment variables.

Provider initialization must validate configuration during startup.

No credentials may be hardcoded.

Providers shall fail fast if mandatory configuration is missing.

---

# Acceptance Criteria

Phase 2 is complete when:

* Google Maps provider implemented.
* Vision provider implemented.
* Municipal provider implemented.
* Adapters implemented.
* Evidence normalization implemented.
* Provider validation implemented.
* Backend builds successfully.
* Shared workspace builds successfully.
* Unit tests pass.
* Integration tests pass.
* No architectural deviations exist.

---

# Testing Matrix

| Component              | Unit | Integration |
| ---------------------- | :--: | :---------: |
| Maps Provider          |   ✓  |      ✓      |
| Vision Provider        |   ✓  |      ✓      |
| Municipal Provider     |   ✓  |      ✓      |
| Provider Adapters      |   ✓  |      ✓      |
| Evidence Normalization |   ✓  |      ✓      |
| Provider Validation    |   ✓  |      ✓      |

---

# Failure Matrix

Validate behaviour for:

* Missing API keys
* Invalid requests
* Invalid coordinates
* Invalid image input
* Provider timeout
* External API failure
* Malformed provider response
* Rate limiting
* Schema mismatch
* Normalization failure

Failures shall return deterministic, structured errors.

No provider failure shall terminate the runtime.

---

# Common Implementation Mistakes

Avoid:

* Calling providers directly from the Decision Engine
* Embedding provider logic inside adapters
* Returning raw provider responses
* Mixing provider implementations
* Hardcoding configuration
* Skipping normalization
* Skipping validation
* Duplicating logic across providers

Every provider must be independently replaceable.

---

# Deliverables

Implement:

* Google Maps Provider
* Vision Provider
* Municipal Provider
* Provider Adapters
* Evidence Normalization
* Validation
* Unit Tests
* Integration Tests

Nothing else.

---

# Engineering Brief

The purpose of this phase is to connect the application to approved external evidence sources while maintaining strict architectural separation.

Every provider should expose a consistent interface and produce normalized Evidence objects regardless of the external API used.

No provider shall contain reasoning, orchestration, confidence evaluation, or persistence logic.

---

# Verification

Before completion verify:

* Backend builds
* Frontend builds
* Shared workspace builds
* Provider initialization succeeds
* Normalization functions correctly
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
        └── Phase2/
            IMPLEMENTATION_REVIEW_PACKAGE.md
```

The review package shall summarize:

* Files created
* Files modified
* Providers implemented
* Adapters implemented
* Normalization layer
* Validation
* Dependencies added
* Tests executed
* Known issues
* Architectural deviations

If none exist, explicitly state:

> No architectural deviations.

---

# Stop Condition

When:

* All acceptance criteria are satisfied.
* Verification passes.
* IMPLEMENTATION_REVIEW_PACKAGE.md has been generated.

STOP.

Do **NOT** begin Phase 3.

Wait for technical review and approval.
