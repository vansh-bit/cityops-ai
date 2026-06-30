# TEST_PLAN.md

# Milestone 5 — Phase 5C

## Runtime Verification & Testing Specification

---

# Purpose

This document defines the mandatory testing requirements for Milestone 5 – Phase 5C.

The objective is to verify that the AI Runtime correctly integrates the Persistence Layer (Cloud Storage, Firestore, Tracking ID) while preserving the architecture established during previous milestones.

Testing must validate correctness, resilience, reliability, atomic persistence, and runtime stability.

Manual UI verification alone is insufficient.

---

# Testing Objectives

The implementation shall verify:

- Production Google Maps integration
- Evidence Provider behaviour
- Evidence aggregation
- Runtime orchestration
- AI decision quality
- Confidence evaluation
- Municipality report generation
- Tracking ID Generation
- Cloud Storage file upload
- Firestore document creation
- Atomic Persistence and Rollbacks
- Failure handling
- API contract compliance

---

# Testing Philosophy

Testing shall follow multiple levels.

```
Unit Tests
        ↓
Integration Tests
        ↓
Runtime Tests
        ↓
Persistence Tests
        ↓
End-to-End Tests
        ↓
Failure Tests
```

Every runtime component must be independently verifiable.

---

# Test Environment

Automated testing shall adhere strictly to the following environment rules:

- **Persistence Tests**: SHALL use the Firebase Local Emulator Suite.
- **Integration Tests**: MAY use a dedicated non-production Firebase project.
- **Production Firebase**: SHALL NEVER be used for automated testing.

---

# Unit Tests

## GoogleMapsProvider

Verify:

- coordinate validation
- reverse geocoding
- municipality lookup
- nearby place discovery
- response normalization
- timeout handling
- retry behaviour
- schema validation

---

## Evidence Aggregator

Verify:

- successful aggregation
- provider ordering
- partial evidence handling
- metadata generation
- evidencePackage validation

---

## Decision Engine & Confidence Engine

Verify:

- VisionResult & evidencePackage consumption
- reasoning generation and priority assignment
- evidence-aware confidence scoring
- partial evidence confidence reduction
- escalation logic

---

## Tracking ID Generator

Verify:

- valid Tracking ID generation
- uniqueness
- non-enumerability
- URL-safe formatting
- duplicate prevention

---

## Cloud Storage Provider

Verify:

- successful upload to private bucket
- unsupported file rejection
- oversized file rejection (strictly enforces 10 MB limit)
- timeout handling
- permission failures
- metadata persistence
- canonical storage path generation

---

## Firestore Provider

Verify:

- successful document creation
- document size within 1 MB limit
- invalid payload rejection
- timeout handling
- permission failures
- retry behaviour (where applicable)
- metadata persistence
- Tracking ID and canonical storage path association

---

## Persistence Coordinator

Verify:

- orchestration sequence
- correct component calling (ID -> Storage -> Firestore)
- atomic persistence success
- rollback verification on failure (e.g. storage succeeds, firestore fails -> storage deleted)

---

# Integration Tests

Verify:

```
Gemini Vision
↓
Google Maps
↓
Evidence Aggregator
↓
Decision Engine
↓
Confidence Engine
↓
Persistence Coordinator (Tracking ID -> Cloud Storage -> Firestore)
```

Tests:

- valid runtime execution
- municipality enrichment
- evidencePackage creation
- report generation
- report successfully persisted with file URL

---

# API Tests

Verify:

## Valid Request

Expected:

HTTP 200 (including Tracking ID and Storage Object Path)

---

## Invalid Request (Validation Failures)

Verify missing image, invalid coordinates, unsupported file, oversized upload.

Expected:

HTTP 400, HTTP 413, HTTP 415

---

## Municipality Not Found

Expected:

HTTP 200 (evidencePackage.overallStatus = PARTIAL)
Runtime continues using available evidence. Do NOT return HTTP 404.

---

## Maps Provider Failure

Expected:

HTTP 200 (evidencePackage.overallStatus = PARTIAL)
Runtime continues using available evidence.

---

## Persistence Failures (Upload Failures, Firestore Failures, Permission Failures)

Expected:

HTTP 500 (with rollback verified and structured persistence error)

---

# End-to-End Submission Tests

Verify complete runtime:

```
Citizen Upload
        ↓
Gemini Vision
        ↓
VisionResult
        ↓
Evidence Coordinator
        ↓
Google Maps Provider
        ↓
Evidence Aggregator
        ↓
evidencePackage
        ↓
Decision Engine
        ↓
Confidence Engine
        ↓
Municipality Report
        ↓
Persistence Coordinator
        ↓
Tracking ID Generator
        ↓
Cloud Storage Provider
        ↓
Firestore Provider
        ↓
Submission Response
```

The runtime shall complete successfully.

---

# Partial Evidence Tests

Simulate:

Google Maps unavailable

Expected:

Runtime continues, partial evidence generated (evidencePackage.overallStatus = PARTIAL), report persists successfully to Cloud Storage and Firestore.

---

# Failure Tests

Simulate:

## Gemini timeout

Expected: Runtime terminates.

## Reverse Geocode / Places API timeout

Expected: Partial evidence, persistence continues.

## Upload Failures

Expected: Cloud Storage failure triggers atomic abort. Firestore is not written. HTTP 500 returned.

## Firestore Failures (Network, Permissions)

Expected: Cloud Storage upload succeeds but Firestore fails. Persistence Coordinator executes rollback to delete orphaned Cloud Storage upload. HTTP 500 returned.

## Rollback Failures

Expected: `PERSISTENCE_ROLLBACK_FAILED` returned. Logged for manual remediation.

---

# Retry Bounds Verification

Verify that retry logic for transient failures respects the following limits:
- maximum retry count: 3
- exponential backoff: enabled
- randomized jitter: enabled
- maximum retry duration: 5000ms

---

# Performance Tests

Verify the following latency budgets:

Tracking ID generation latency

< 50ms

Cloud Storage upload latency

< 2s

Firestore write latency

< 1s

Total Persistence Layer latency

< 3s

Overall Runtime

< 30s

**Concurrency Verification**:
Testing shall verify that runtime latency reflects parallel execution rather than sequential execution where applicable.

---

# Security Tests

Verify:

- invalid MIME types rejected
- oversized uploads rejected
- coordinates validated
- provider responses sanitized
- API keys never exposed
- Firebase server credentials never exposed
- stack traces never returned
- Database internal identifiers not leaked
- Uploads execute securely on the backend
- Cloud Storage bucket is private by default

---

# Schema Validation Tests

Verify:

VisionResult conforms to `VISION_RESULT_SCHEMA.md`
evidencePackage conforms to `EVIDENCE_SCHEMA.md`
API responses conform to `API_CONTRACT.md`

---

# Regression Tests

Verify that existing functionality remains unchanged.

Specifically:

- upload workflow
- Gemini Vision integration
- Decision Engine
- Confidence Engine
- Municipality Report generation
- Demo UI behaviour

Phase 5C shall not introduce regressions into Phase 5A or Phase 5B. Existing tests must remain valid.

---

# Acceptance Criteria

Testing is complete only when:

- All unit tests pass.
- All integration tests pass.
- All end-to-end submission tests pass.
- All API tests pass.
- All failure tests pass (including atomic rollback verification).
- All schema validation tests pass.
- No regressions are detected.
- Build succeeds.
- TypeScript compilation succeeds.

---

# Deliverables

Implementation shall provide:

- Automated test suite (utilizing Firebase Local Emulator)
- Test execution summary
- Coverage report
- Runtime verification evidence
- Failure test evidence
- Performance measurements

---

# Definition of Success

Phase 5C testing is successful when the AI Runtime can reliably combine visual perception and contextual evidence to produce deterministic municipal decisions, and permanently, atomically store those decisions without regressions.

The implementation shall demonstrate production-quality behaviour while preserving the modular runtime architecture established throughout the project.

---

# Version

Test Plan Version

v3.1

Target Milestone

Milestone 5 — Phase 5C

This document is the authoritative testing specification for Milestone 5 – Phase 5C.