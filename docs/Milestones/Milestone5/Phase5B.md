# Phase5B.md

# Milestone 5 — Phase 5B

## Production Evidence Collection

---

# Overview

Phase 5B extends the CityOps AI Runtime by replacing simulated evidence providers with production evidence sources.

Following Phase 5A, the runtime is capable of analyzing real citizen-submitted images using Gemini Vision.

Phase 5B enables the AI Runtime to collect real-world contextual evidence before making municipal decisions.

Rather than relying solely on visual perception, the AI will actively gather supporting information from external services to improve decision quality, explainability, and confidence.

This phase preserves the runtime architecture established during Milestones 1–4 and extends the existing Evidence Collection Layer with production-ready evidence providers.

---

# Objectives

The primary objectives of Phase 5B are:

* Integrate Google Maps as a production Evidence Provider.
* Collect contextual geographic evidence.
* Resolve municipality and jurisdiction information.
* Normalize provider outputs into the Evidence Package.
* Preserve the existing Evidence Orchestration architecture.
* Improve AI decision quality through external evidence.

---

# Vision

CityOps AI should behave like an experienced municipal investigator.

Instead of making decisions using only an uploaded image, the AI should identify missing information, collect relevant evidence, and then make a better-informed decision.

The decision process becomes:

```text
Citizen Upload
        ↓
Gemini Vision
        ↓
VisionResult
        ↓
Decision Engine identifies missing context
        ↓
Evidence Coordinator
        ↓
Google Maps Provider
        ↓
Evidence Aggregator
        ↓
Evidence Package
        ↓
Decision Engine
        ↓
Confidence Engine
        ↓
Municipality Report
```

The AI reasons using both perception and evidence.

---

# Scope

## Included

Phase 5B includes:

* Google Maps Provider
* Reverse Geocoding
* Municipality Resolution
* Nearby Infrastructure Discovery
* Geographic Context Collection
* Evidence Normalization
* Evidence Aggregation
* Runtime Integration
* Logging
* Testing

---

## Explicitly Excluded

The following features are intentionally deferred:

* Firestore
* Cloud Storage
* Authentication
* Notifications
* Municipality Dashboard
* Weather Integration
* Traffic Data
* Report Persistence

These belong to later milestones.

---

# Deliverables

Implementation shall produce:

* Production Google Maps Provider
* MapsEvidence generation
* Evidence Package generation
* Runtime integration
* Provider validation
* Logging
* Automated tests
* Documentation updates
* Implementation evidence

---

# Demo Transparency

To maximize hackathon presentation polish, recommend exposing runtime telemetry within the demo UI.
Examples:
* `providerCount`
* `collectionDurationMs`
* Provider execution durations

These values are intended for transparency and judge visibility. They must remain optional UI enhancements and shall not affect runtime behaviour.

---

# Architecture Requirements

The following components are architecturally locked:

* Runtime Coordinator
* Decision Engine
* Confidence Engine
* Tool Registry
* Evidence Coordinator
* Evidence Aggregator

Only provider implementations may change.

No runtime redesign is permitted.

---

# Engineering Principles

Implementation must follow:

* Clean Architecture
* SOLID Principles
* Provider Abstraction
* Dependency Inversion
* Strong Typing
* Structured Logging
* Deterministic Behaviour
* Fail-Safe Error Handling

Google Maps shall remain fully encapsulated behind the provider abstraction.

---

# Runtime Behaviour

The Google Maps Provider is an Evidence Provider.

It does not perform reasoning.

It only collects contextual information.

The runtime sequence is:

```text
VisionResult
        ↓
Evidence Request
        ↓
Evidence Coordinator
        ↓
Google Maps Provider
        ↓
MapsEvidence
        ↓
Evidence Aggregator
        ↓
EvidencePackage
        ↓
Decision Engine
```

---

# Acceptance Criteria

Phase 5B is considered complete when:

* Coordinates are validated.
* Reverse Geocoding succeeds.
* Municipality information is resolved.
* Nearby infrastructure is collected.
* Evidence is normalized.
* EvidencePackage is generated.
* Decision Engine consumes EvidencePackage.
* Confidence Engine executes successfully.
* Municipality Report reflects additional evidence.
* Runtime architecture remains unchanged.
* Automated tests pass.

---

# Evidence Required

Capture evidence demonstrating:

* Successful Reverse Geocoding
* Municipality Resolution
* Nearby Infrastructure Discovery
* Evidence Aggregation
* Runtime Execution
* Updated Municipality Report
* Confidence Improvement
* Partial Failure Handling
* Automated Test Results

These artifacts shall become part of the implementation review package.

---

# Testing Requirements

Implementation shall satisfy the requirements defined in:

* TEST_PLAN.md
* GOOGLE_MAPS_SPEC.md
* EVIDENCE_SCHEMA.md

Testing must include:

* Unit Tests
* Integration Tests
* Runtime Tests
* Failure Tests
* End-to-End Tests

Manual verification alone is insufficient.

---

# Implementation Order

The recommended implementation sequence is:

1. Configure Google Maps APIs.
2. Implement Google Maps Provider.
3. Normalize Maps responses into MapsEvidence.
4. Generate EvidencePackage.
5. Integrate with Evidence Coordinator.
6. Integrate with Evidence Aggregator.
7. Connect Decision Engine.
8. Update API responses.
9. Implement logging.
10. Implement automated tests.
11. Perform runtime validation.
12. Collect implementation evidence.

---

# Risks

Potential implementation risks include:

* Google API quota limits
* Reverse Geocoding failures
* Invalid coordinates
* Partial provider failures
* Increased runtime latency

These risks must be mitigated through graceful error handling and provider isolation.

---

# Definition of Success

Phase 5B is successful when CityOps AI transitions from an AI that only analyzes images to an AI that actively gathers external evidence before making decisions.

The runtime should demonstrate that municipal decisions are based on both visual perception and verified contextual information while maintaining the modular architecture established throughout previous milestones.

Completion of Phase 5B establishes the foundation for Phase 5C, where evidence-backed reports become persistent municipal records through Firebase Cloud Storage and Firestore.
