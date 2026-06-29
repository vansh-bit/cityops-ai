# TEST_PLAN.md

# Milestone 5 — Phase 5A

## Test Strategy & Validation Plan

---

# Purpose

This document defines the mandatory testing strategy for **Milestone 5 – Phase 5A**.

Its objective is to verify that the Gemini Vision integration functions correctly while preserving the architecture validated during Milestones 1–4.

Testing shall validate:

* Functional correctness
* Runtime stability
* Error handling
* Integration quality
* Architectural compliance

Implementation is **not considered complete** until all mandatory test cases pass.

---

# Testing Philosophy

Testing follows a layered approach.

```text
Unit Tests
      ↓
Integration Tests
      ↓
Runtime Tests
      ↓
End-to-End Tests
      ↓
Acceptance Validation
```

Each layer validates a different aspect of the system.

---

# Test Categories

Phase 5A includes:

* Unit Testing
* Integration Testing
* Runtime Testing
* End-to-End Testing
* Failure Testing
* Performance Validation
* Acceptance Testing

---

# Unit Tests

## Gemini Vision Provider

Verify:

* Gemini client initialization
* Prompt generation
* Image submission
* Response parsing
* JSON validation
* Schema validation

Expected Result

All provider functions execute successfully.

---

## VisionResult Validation

Verify:

* Required fields
* Enum validation
* String validation
* Array validation
* Unknown value handling

Expected Result

Only valid VisionResult objects are accepted.

---

## Upload Validation

Verify:

* Supported formats
* Missing image
* Invalid extension
* Oversized upload
* Empty request

Expected Result

Invalid uploads are rejected before runtime execution.

---

# Integration Tests

## Upload → Gemini

Scenario

Upload a valid municipal image.

Expected

Gemini receives the request and returns a valid VisionResult.

---

## Gemini → Runtime

Scenario

Gemini returns a valid response.

Expected

Decision Engine receives a valid VisionResult.

---

## Runtime Pipeline

Scenario

Complete runtime execution.

Expected Flow

```text
Upload
   ↓
Gemini
   ↓
VisionResult
   ↓
Decision Engine
   ↓
Evidence Layer
   ↓
Confidence Engine
   ↓
Municipality Report
```

Expected Result

Pipeline completes successfully.

---

# Runtime Tests

Verify:

* Runtime Coordinator remains stable.
* Decision Engine executes correctly.
* Evidence Layer receives VisionResult.
* Confidence Engine calculates results.
* Municipality report is generated.

No architectural boundaries may be violated.

---

# End-to-End Tests

## Test 1

Input

Road pothole image

Expected

* Issue detected
* Severity assigned
* Report generated

Status

Mandatory

---

## Test 2

Input

Garbage accumulation image

Expected

* Correct classification
* Municipality report generated

Status

Mandatory

---

## Test 3

Input

Broken streetlight

Expected

* Infrastructure identified
* High confidence output

Status

Mandatory

---

## Test 4

Input

Drain overflow

Expected

* Correct issue category
* Correct priority

Status

Mandatory

---

## Test 5

Input

Fallen tree

Expected

* Hazard detected
* Municipality report generated

Status

Mandatory

---

# Failure Tests

## Invalid File Type

Expected

415 Unsupported Media Type

---

## Missing Image

Expected

400 Bad Request

---

## Oversized File

Expected

413 Payload Too Large

---

## Gemini Timeout

Expected

Automatic retry once.

If retry fails:

504 Gateway Timeout

---

## Gemini Service Unavailable

Expected

503 Service Unavailable

---

## Invalid Gemini JSON

Expected

Response rejected.

Runtime not executed.

---

## Schema Validation Failure

Expected

Runtime terminated safely.

Structured error returned.

---

## Safety Refusal

Expected

Structured CONTENT_NOT_SUPPORTED error.

---

# Performance Tests

Verify:

* Upload validation executes immediately.
* Runtime remains responsive.
* No excessive memory usage.
* Response time remains acceptable.
* No blocking operations.

Target

Average response time:

Less than 10 seconds.

Maximum acceptable response time:

30 seconds.

These targets apply under normal network conditions and standard image sizes.

Performance may vary depending on external API latency.

---

# Acceptance Tests

Phase 5A is accepted only if all of the following pass.

| Requirement                    | Status    |
| ------------------------------ | --------- |
| Image Upload                   | Mandatory |
| Gemini Integration             | Mandatory |
| VisionResult Validation        | Mandatory |
| Runtime Integration            | Mandatory |
| Decision Engine Execution      | Mandatory |
| Confidence Engine Execution    | Mandatory |
| Municipality Report Generation | Mandatory |
| Structured Error Handling      | Mandatory |
| Logging                        | Mandatory |
| API Contract Compliance        | Mandatory |

---

# Test Data

The following representative images should be used.

* Pothole
* Garbage
* Broken Streetlight
* Drain Overflow
* Fallen Tree

Additional cases:

* Blurry image
* Low-light image
* Empty road
* Invalid image
* Corrupted file

---

# Evidence Required

Capture screenshots demonstrating:

* Upload UI
* Successful image upload
* Gemini analysis
* VisionResult generation
* Runtime execution
* Confidence score
* Municipality report
* Error handling
* Successful completion

These artifacts become part of the implementation review package.

---

# Exit Criteria

Phase 5A shall not proceed to review until:

* All mandatory tests pass.
* No critical defects remain.
* Runtime architecture remains unchanged.
* API contract is satisfied.
* VisionResult schema is fully validated.
* Evidence has been captured.
* Documentation is updated.

---

# Success Criteria

Testing is considered successful when:

* Every mandatory test passes.
* The runtime executes without architectural violations.
* Gemini integrates successfully.
* Invalid inputs are handled correctly.
* Failure scenarios are recovered gracefully.
* Users receive deterministic and consistent results.
* The implementation is ready for independent technical review.

---

# Version

Test Plan Version

v1.0

Target Milestone

Milestone 5 — Phase 5A

This document is the authoritative testing specification for Phase 5A and defines the minimum validation required before implementation approval.
