# API_CONTRACT.md

# Milestone 5 — Phase 5C

## Frontend–Backend API Contract

---

# Purpose

This document defines the canonical API contract between the CityOps AI frontend and backend for **Phase 5C**.

Its purpose is to establish a stable communication interface for AI-powered municipal incident analysis, now culminating in atomic persistence via Firebase Cloud Storage and Firestore.
The frontend and backend shall communicate only through the interfaces defined in this document.

Undocumented request or response formats are prohibited.

---

# Design Principles

The API shall be:

* Stateless
* Versioned
* RESTful
* JSON-based
* Deterministic
* Backward compatible
* Independent of Gemini-specific formats

The frontend must never receive raw Gemini responses or internal persistence structures.

All AI output shall be normalized by the providers before being returned.

---

# API Version

Current Version

```text
v1
```

Base Route

```text
/api/v1
```

---

# Endpoint

## Submit Incident Report

```http
POST /api/v1/analyze
```

Purpose

Accept a citizen-submitted image, execute the complete Phase 5C runtime (including analysis, evidence gathering, and atomic persistence), and return the final Submission Response.

---

# Request

## Content Type

```http
multipart/form-data
```

---

## Request Fields

| Field       | Type    | Required | Description                    |
| ----------- | ------- | -------- | ------------------------------ |
| image       | File    | Yes      | Uploaded incident image        |
| latitude    | String  | Yes      | Latitude of incident location  |
| longitude   | String  | Yes      | Longitude of incident location |
| description | String  | No       | Optional citizen description   |

*(Note: `demoMode` and other undocumented fields are not supported.)*

---

## Serialization Boundary

Because the request uses `multipart/form-data`, all non-file fields are transmitted as strings.
- The frontend submits `latitude` and `longitude` as strings.
- The backend validates these string values.
- The backend converts them to numeric coordinates (`Number`) before runtime execution.
- Invalid coordinate values result in an `INVALID_COORDINATES` HTTP 400 validation error.

---

## Supported Image Formats

* JPG
* JPEG
* PNG
* WEBP

---

## Maximum File Size

```text
10 MB
```

---

# Successful Submission Response

In Phase 5C, a successful request guarantees that the report has been atomically persisted. The response returned is a **Successful Submission Response**, extending the previous Analysis Response.

## HTTP Status

```http
200 OK
```

---

## Response Body

```json
{
  "success": true,
  "trackingId": "9bX2pLq4vM8cW",
  "submissionStatus": "SUBMITTED",
  "timestamp": "2026-07-01T10:45:00Z",

  "persistence": {
    "firestoreStatus": "PERSISTED",
    "cloudStorageStatus": "UPLOADED",
    "storageObjectPath": "gs://cityops-ai-storage/reports/9bX2pLq4vM8cW/original.jpg"
  },

  "visionResult": {
    "...": "See VISION_RESULT_SCHEMA.md"
  },

  "evidencePackage": {
    "...": "See EVIDENCE_SCHEMA.md"
  },

  "decision": {
    "category": "ROAD_DAMAGE",
    "priority": "HIGH",
    "assignedDepartment": "Public Works",
    "reasoning": "Road damage confirmed using visual and contextual evidence."
  },

  "confidence": {
    "overallScore": 94,
    "confidenceLevel": "HIGH",
    "escalationRequired": false,
    "reasoning": "Vision analysis supported by verified location evidence."
  },

  "report": {
    "reportTitle": "Road Damage Incident",
    "summary": "Large pothole detected on public roadway.",
    "recommendedAction": "Dispatch road maintenance team.",
    "status": "SUBMITTED"
  }
}
```

---

# Response Components

The backend returns seven normalized objects.

---

## trackingId & persistence

Produced by:

Persistence Coordinator, Tracking ID Generator, Cloud Storage Provider, and Firestore Provider.

Purpose:

Provides the cryptographically secure, random, globally unique `trackingId` and confirms atomic persistence.
The `persistence` object includes `firestoreStatus`, `cloudStorageStatus`, and `storageObjectPath` (canonical reference) providing the frontend with direct confirmation that the upload was saved. No publicly readable bucket URLs are exposed. Application-generated signed URLs or authorized access mechanisms must be used for future retrieval.

---

## visionResult

Produced by:

GeminiVisionProvider

Purpose:

Normalized perception output generated from the uploaded image.

Contract:

Must conform exactly to VISION_RESULT_SCHEMA.md.

---
## evidencePackage

Produced by:

Evidence Collection Layer

Purpose:

Represents contextual information collected from external evidence providers.

Must conform to:

EVIDENCE_SCHEMA.md

---

## decision

Produced by:

Decision Engine

Purpose:

Represents the AI Runtime's interpretation of the normalized vision result.

Contains:

- incident category
- municipality priority
- assigned department
- reasoning summary

---

## confidence

Produced by:

Confidence Engine

Purpose:

Represents the runtime's confidence in the generated decision.

Contains:

- overall confidence score
- confidence level
- escalationRequired
- reasoning

---

## report

Produced by:

Municipality Report Generator

Purpose:

Represents the final municipality-ready incident report.

Contains:

- report title
- executive summary
- recommended action
- report status (now updated to `SUBMITTED` post-persistence)

---

# Error Responses

All failures return structured JSON.
## Successful Execution

HTTP

200 OK

Always returned when:
- Vision analysis succeeds.
- Runtime executes successfully.
- Persistence Coordinator successfully saves the image to Cloud Storage and report to Firestore.

If Evidence Providers return partial results or fail (e.g. Municipality Not Found or Maps Provider Failure), but persistence succeeds, a 200 OK is returned with `evidencePackage.overallStatus = PARTIAL`. Missing municipality continues following the existing Phase 5B philosophy: HTTP 200, `overallStatus = PARTIAL`, and the Decision Engine continues operating using available evidence.

---

## Invalid Request

```http
400 Bad Request
```

---

## Unsupported File

```http
415 Unsupported Media Type
```

---

## Payload Too Large

```http
413 Payload Too Large
```

---

## Gemini Timeout

```http
504 Gateway Timeout
```

---

## Gemini Service Failure

```http
503 Service Unavailable
```

---

## Internal Runtime Error

```http
500 Internal Server Error
```

Includes persistence failures, Cloud Storage failures, or Firestore network issues.

---

# Error Object

All errors shall follow this structure.

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

The frontend shall never depend on provider-specific error messages.

---

# Validation Rules

Before runtime execution:

- Image must exist.
- Coordinates must be valid.
- File type must be supported.
- File size must not exceed limits.

Before returning a successful response, the backend shall verify:

- VisionResult conforms to VISION_RESULT_SCHEMA.md.
- evidencePackage conforms to EVIDENCE_SCHEMA.md.
- Decision object is complete.
- Confidence object is present.
- Municipality Report is generated.
- Persistence successfully occurred.
- Response conforms to the documented API contract.

Invalid responses shall never be returned to clients.
---

# Runtime Behaviour

Successful execution follows this sequence.

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

The frontend communicates with a single endpoint.

Internal orchestration remains hidden.

---

# Security Requirements

The API shall:

* Validate uploaded files.
* Reject unsupported content types.
* Never expose API keys.
* Never expose raw Gemini responses.
* Never expose internal runtime exceptions or database paths.
* Return sanitized error messages.
* Validate latitude and longitude before external API requests.
* Never expose raw Google Maps responses.
* Never expose provider-specific implementation details.

---

# Future Compatibility

This contract is designed to evolve without breaking existing frontend implementations.

Future milestones may extend the response with:
- municipalityId
- evidenceSources
- mapVerification

Existing required response fields shall remain backward compatible.

Breaking API changes require a new contract version.

---

# Success Criteria

The API contract is considered complete when:

- The frontend submits a valid citizen report.
- Gemini Vision analysis completes successfully.
- Evidence Providers enrich the analysis with contextual information.
- The Persistence layer atomically uploads the image to a private Cloud Storage bucket and saves the report to Firestore with a unique Tracking ID.
- Responses conform to documented schemas.
- Error handling is deterministic.

---
# Contract Ownership

This document defines the public communication interface between the frontend and backend.

Internal implementations of the Runtime Coordinator, Persistence Coordinator, Decision Engine, Confidence Engine, Municipality Report Generator, and Providers may evolve independently provided they continue producing responses compliant with this contract.

# Version

Contract Version

v1.1

Target Milestone

Milestone 5 — Phase 5C

This document is the authoritative specification governing all frontend–backend communication for production image analysis and persistence during Phase 5C.
