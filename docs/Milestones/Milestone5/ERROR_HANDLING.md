# ERROR_HANDLING.md

# Milestone 5 — Phase 5C

## Runtime Error Handling Specification

---

# Purpose

This document defines the error handling strategy for CityOps AI during Phase 5C.

The objective is to ensure that failures occurring within the AI Runtime and Persistence Layer are handled predictably, safely, and consistently while preserving system stability.

The runtime shall never expose provider-specific implementation details to frontend consumers.

Whenever possible, the runtime shall degrade gracefully rather than terminate execution, except during persistence where atomicity is strictly enforced.

---

# Design Principles

The runtime shall be:

- Deterministic
- Fault tolerant
- Provider independent
- Recoverable
- Observable
- User friendly

Internal provider failures shall never leak raw implementation details.

---

# Runtime Error Philosophy

CityOps AI treats external AI services, evidence providers, and persistence services as untrusted dependencies.

Every provider may fail independently.

Failures should:

- be isolated
- be logged
- be normalized
- preserve runtime stability
- trigger atomic rollbacks when occurring in the persistence layer

The Runtime Coordinator and Persistence Coordinator are responsible for determining whether execution should continue or terminate.

---

# Error Categories

Errors are classified into:

## Validation Errors

Examples

- missing image
- invalid coordinates
- unsupported file
- oversized upload
- malformed request

Response

HTTP 400

Runtime execution shall not begin.

---

## Vision Provider Errors

Examples

- Gemini timeout
- malformed response
- schema validation failure
- safety block
- API unavailable

These errors originate from the GeminiVisionProvider.

The provider shall normalize all failures before returning them.

---

## Evidence Provider Errors

Examples

- Reverse Geocoding failure
- Municipality resolution failure
- Places API timeout
- Google Maps unavailable
- Quota exceeded

Evidence Provider failures shall never directly terminate the runtime.

Partial evidence is permitted.

---

## Runtime Errors

Examples

- aggregation failure
- Decision Engine failure
- Confidence Engine failure
- report generation failure

These indicate internal runtime faults.

---

## Persistence Errors

Examples

- Tracking ID generation failure
- Cloud Storage upload timeout
- Firebase storage bucket unavailable
- Firestore permission denied
- Firestore network interruption
- Invalid persistence payload

Persistence requires atomicity. Failures here must rollback any partial operations.

---

## Infrastructure Errors

Examples

- network failure
- DNS failure
- configuration error
- missing API key
- missing Firebase credentials

---

# Runtime Behaviour

The runtime shall follow this policy.

## Validation Failure

```
Reject Request
↓
Return HTTP 400
↓
Do Not Execute Runtime
```

---

## Vision Failure

```
Gemini Failure
↓
Return Structured Error
↓
Terminate Runtime
```

Vision is mandatory. Execution cannot continue without a valid VisionResult.

---

## Evidence Failure

```
Google Maps Failure
↓
Return Partial Evidence (overallStatus = PARTIAL)
↓
Continue Runtime
↓
Decision Engine
↓
Confidence Engine
↓
Municipality Report
↓
Persistence Coordinator
```

Evidence providers are optional. The runtime should continue whenever sufficient information exists.

---

## Persistence Failure and Rollback Behaviour

```
Persistence Error (e.g. Firestore failure after Cloud Storage upload)
↓
Rollback any completed Persistence actions (e.g. delete orphaned image from Cloud Storage)
↓
Structured Logging (include trackingId and storage object reference)
↓
Return HTTP 500 Structured Persistence Error
↓
Terminate Execution
```

The runtime shall never persist partial reports. Either the Image + Report persists successfully, or neither persists.

If Firestore persistence fails after Cloud Storage upload completes:
- rollback image upload
- log structured failure
- log storage object reference
- log Tracking ID
- return structured persistence error

If the rollback itself fails:
- return `PERSISTENCE_ROLLBACK_FAILED`
- log for manual remediation
- never leave behaviour undefined

---

## Internal Runtime Failure

```
Unexpected Runtime Error
↓
Structured Logging
↓
Return HTTP 500
↓
Terminate Runtime
```

---

# Standard Error Object

Every failure shall return:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

No provider-specific exceptions shall be returned.

---

# Error Codes

## Validation

- INVALID_REQUEST
- IMAGE_REQUIRED
- INVALID_IMAGE
- INVALID_FILE_TYPE
- FILE_TOO_LARGE
- INVALID_COORDINATES

---

## Vision Provider

- GEMINI_TIMEOUT
- GEMINI_UNAVAILABLE
- INVALID_VISION_RESPONSE
- VISION_SCHEMA_ERROR
- CONTENT_NOT_SUPPORTED

---

## Evidence Provider

- MAPS_TIMEOUT
- MAPS_UNAVAILABLE
- MUNICIPALITY_NOT_FOUND
- INVALID_LOCATION
- PLACES_API_FAILURE
- QUOTA_EXCEEDED

*(Note: `PARTIAL_EVIDENCE` is NOT an error code. It is represented as `evidencePackage.overallStatus = PARTIAL`.)*

---

## Runtime

- DECISION_ENGINE_FAILURE
- CONFIDENCE_ENGINE_FAILURE
- REPORT_GENERATION_FAILURE
- EVIDENCE_AGGREGATION_FAILURE
- INTERNAL_RUNTIME_ERROR

---

## Persistence

- TRACKING_ID_GENERATION_FAILURE
- CLOUD_STORAGE_UPLOAD_FAILURE
- CLOUD_STORAGE_UNAVAILABLE
- FIRESTORE_PERSISTENCE_FAILURE
- FIRESTORE_UNAVAILABLE
- PERSISTENCE_ROLLBACK_FAILED
- ATOMIC_PERSISTENCE_FAILURE

---

# Retry Policy

Automatic retry is permitted only for transient failures.

To prevent thundering herds during transient outages, immediate retries are prohibited.
Retry strategies must implement the following bounds:

- **Maximum retry count**: 3 attempts
- **Exponential backoff**: Yes
- **Randomized jitter**: Yes
- **Maximum retry duration**: 5000ms

Retry:

- network timeout
- temporary provider outage
- DNS failure
- intermittent Firestore connection issues
- intermittent Cloud Storage upload failures

Do not retry:

- invalid requests
- malformed responses
- unsupported content
- schema validation failures
- quota exceeded
- Firebase permission denied

---

# Partial Evidence vs Atomic Persistence

The runtime supports partial evidence collection:

```
Gemini Vision ✓
Google Maps ✗
evidencePackage -> PARTIAL
Decision Engine ✓
Confidence Engine (score lowered) ✓
Municipality Report ✓
Persistence Coordinator ✓
```

However, the Persistence Layer **strictly forbids** partial persistence. 
If Cloud Storage uploads the image successfully but Firestore fails to write the document, the Cloud Storage image MUST be rolled back, and the client receives a 500 error.

---

# Logging Requirements

Every error shall include:

- trackingId (or temporary correlation ID if tracking ID is not yet generated)
- timestamp
- provider
- error category
- normalized error code
- execution duration

Sensitive information shall never be logged.

Do not log:

- API keys
- authentication tokens
- uploaded image contents
- provider credentials
- Firebase service account secrets

---

# User-Facing Messages

The frontend shall receive user-friendly messages only.

Examples

Instead of:

```
GoogleApiException: ReverseGeocoder returned 429
```

Return:

```
Unable to verify location at this time.
```

Instead of:

```
FirebaseError: Missing or insufficient permissions.
```

Return:

```
An internal database error occurred while saving your report.
```

---

# Provider Isolation

Each provider shall normalize its own failures.

- GeminiVisionProvider handles Vision errors.
- GoogleMapsProvider handles Maps errors.
- CloudStorageProvider handles Firebase Storage errors.
- FirestoreProvider handles Firestore Database errors.

The Runtime/Persistence Coordinators shall never interpret provider-native exceptions.

---

# Testing Requirements

Verify:

- invalid upload
- invalid coordinates
- Gemini timeout
- Maps quota exceeded
- partial evidence
- Cloud Storage upload failures
- Firestore permission failures
- Tracking ID generation failures
- Persistence rollback behaviour (atomic verification, rollback failures)
- runtime exception

Every documented error must have at least one automated test.

---

# Success Criteria

The error handling strategy is successful when:

- every failure is deterministic
- provider failures are isolated
- partial evidence is gracefully supported without failing the runtime
- persistence is strictly atomic (rollback verified)
- runtime stability is preserved
- frontend responses remain consistent
- no provider-specific implementation details are exposed

---

# Version

Specification Version

v2.2

Target Milestone

Milestone 5 — Phase 5C

This document is the authoritative specification governing runtime error handling for CityOps AI during Phase 5C.