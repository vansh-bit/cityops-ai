# API_CONTRACT.md

# Milestone 5 — Phase 5A

## Frontend–Backend API Contract

---

# Purpose

This document defines the canonical API contract between the CityOps AI frontend and backend for **Phase 5A**.

Its purpose is to establish a stable communication interface for image analysis using the production Gemini Vision Provider.

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

The frontend must never receive raw Gemini responses.

All Gemini output shall be normalized by the GeminiVisionProvider before being returned.

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

## Analyze Image

```http
POST /api/v1/analyze
```

Purpose

Accept a citizen-submitted image, execute the complete Phase 5A runtime, and return the generated municipal incident analysis.

---

# Request

## Content Type

```http
multipart/form-data
```

---

## Request Fields

| Field       | Type    | Required | Description                                    |
| ----------- | ------- | -------- | ---------------------------------------------- |
| image       | File    | Yes      | Uploaded incident image                        |
| latitude    | Number  | No       | Optional location (reserved for future phases) |
| longitude   | Number  | No       | Optional location (reserved for future phases) |
| description | String  | No       | Optional citizen description                   |
| demoMode    | Boolean | No       | Indicates demo execution                       |

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

# Successful Response

## HTTP Status

```http
200 OK
```

---

## Response Body

```json
{
  "success": true,
  "requestId": "req_123456789",
  "timestamp": "2026-06-30T10:45:00Z",

  "visionResult": {
    "issueType": "POTHOLE",
    "severity": "HIGH",
    "description": "Large pothole visible on the roadway.",
    "observations": [
      "Road surface collapse",
      "Standing water"
    ],
    "potentialHazards": [
      "Vehicle damage",
      "Motorcycle safety risk"
    ],
    "infrastructure": "ROAD",
    "inspectionPriority": "HIGH",
    "reasoningSummary": "Visible structural damage requiring inspection.",
    "limitations": []
  },

  "decision": {
    "category": "ROAD_DAMAGE",
    "priority": "HIGH",
    "assignedDepartment": "Public Works",
    "reasoning": "Road damage presents a public safety hazard."
  },

  "confidence": {
    "overallScore": 91,
    "confidenceLevel": "HIGH",
    "escalationRequired": false,
    "reasoning": "Strong visual evidence with minimal ambiguity."
  },

  "report": {
    "reportTitle": "Road Damage Incident",
    "summary": "Large pothole detected.",
    "recommendedAction": "Dispatch inspection team.",
    "status": "READY_FOR_SUBMISSION"
  }
}
```

---

# Response Components

The backend returns four normalized objects.

---

## visionResult

Produced by:

GeminiVisionProvider

Purpose:

Normalized perception output generated from the uploaded image.

Contract:

Must conform exactly to VISION_RESULT_SCHEMA.md.

The frontend must never consume raw Gemini responses.

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

The Decision Engine remains the sole owner of this object.

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

Gemini never produces confidence values.

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
- report status

Future milestones may extend this object with tracking information and persistence metadata while maintaining backward compatibility.

---

# Error Responses

All failures return structured JSON.

---

## Invalid Request

```http
400 Bad Request
```

Example

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Image file is required."
  }
}
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
- File type must be supported.
- File size must not exceed limits.
- Request format must be valid.

Invalid requests shall never reach the Gemini Vision Provider.

Before returning a successful response, the backend shall verify:

- VisionResult conforms to VISION_RESULT_SCHEMA.md.
- Decision object has been generated.
- Confidence object has been generated.
- Municipality Report object has been generated.
- Response matches the API contract.

Incomplete or invalid responses shall never be returned to the frontend.
---

# Runtime Behaviour

Successful execution follows this sequence.

```text
Upload Image
      ↓
Request Validation
      ↓
GeminiVisionProvider
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
      ↓
HTTP Response
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
* Never expose internal runtime exceptions.
* Return sanitized error messages.

---

# Future Compatibility

This contract is designed to evolve without breaking existing frontend implementations.

Future milestones may extend the response with:

- trackingId
- firestoreDocumentId
- uploadedImageUrl
- municipalityId
- evidenceSources
- duplicateReportAnalysis
- mapVerification
- submissionStatus

Existing required response fields shall remain backward compatible.

Breaking API changes require a new contract version.

---

# Success Criteria

The API contract is considered complete when:

* The frontend can submit a valid image.
* The backend validates the request.
* Gemini Vision is invoked successfully.
* The runtime executes without exposing implementation details.
* Responses conform to documented schemas.
* Error handling is deterministic.
* Future phases can extend the contract without breaking existing clients.


---
# Contract Ownership

This document defines the public communication interface between the frontend and backend.

Internal implementations of the Runtime Coordinator, Decision Engine, Confidence Engine, Municipality Report Generator, and GeminiVisionProvider may evolve independently provided they continue producing responses compliant with this contract.

No implementation shall expose provider-specific responses directly to frontend consumers.

# Version

Contract Version

v1.0

Target Milestone

Milestone 5 — Phase 5A

This document is the authoritative specification governing all frontend–backend communication for production image analysis during Phase 5A.
