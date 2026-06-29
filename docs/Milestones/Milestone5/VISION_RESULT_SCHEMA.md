# VISION_RESULT_SCHEMA.md

# Milestone 5 — Phase 5A

## VisionResult Schema Specification

---

# Purpose

This document defines the canonical **VisionResult** schema returned by the Gemini Vision Provider.

It serves as the contract between the **GeminiVisionProvider** and the downstream AI Runtime.

All Vision Provider implementations must return data conforming to this schema.

The Decision Engine, Evidence Layer, and Confidence Engine must consume only this normalized representation and must never depend on Gemini-native response formats.

---

# Design Principles

The schema is designed to be:

* Deterministic
* Provider-independent
* Strongly typed
* Extensible
* Easy to validate
* Backward compatible

---

# Runtime Position

```text
Citizen Upload
      ↓
Gemini Vision
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
```

VisionResult is the only object passed from the Vision Provider into the AI Runtime.

---

# Canonical Schema

```typescript
interface VisionResult {
    issueType: IssueType;
    severity: SeverityLevel;
    description: string;
    observations: string[];
    potentialHazards: string[];
    infrastructure: InfrastructureType;
    inspectionPriority: PriorityLevel;
    reasoningSummary: string;
    limitations: string[];
}
```

---

# Field Definitions

## issueType

Primary issue detected.

Type

```text
IssueType
```

Allowed Values

```text
POTHOLE
GARBAGE
BROKEN_STREETLIGHT
DRAIN_OVERFLOW
FALLEN_TREE
ROAD_DAMAGE
WATER_LEAK
GRAFFITI
TRAFFIC_SIGNAL
UNKNOWN
```

Required

✅ Yes

---

## severity

Estimated visual severity.

Type

```text
SeverityLevel
```

Allowed Values

```text
LOW
MEDIUM
HIGH
CRITICAL
UNKNOWN
```

Required

✅ Yes

---

## description

Human-readable description of the visible issue.

Type

```text
string
```

Maximum Length

500 characters

Required

✅ Yes

---

## observations

List of visible observations.

Examples

* Standing water
* Cracked asphalt
* Exposed wiring
* Overflowing waste

Type

```text
string[]
```

Required

✅ Yes

Can be empty.

---

## potentialHazards

Possible risks inferred from visible evidence.

Examples

* Vehicle damage
* Pedestrian hazard
* Flooding risk
* Electrical danger

Type

```text
string[]
```

Required

✅ Yes

---

## infrastructure

Primary infrastructure affected.

Allowed Values

```text
ROAD
FOOTPATH
DRAIN
STREETLIGHT
TRAFFIC_SIGNAL
PARK
PUBLIC_PROPERTY
UNKNOWN
```

Required

✅ Yes

---

## inspectionPriority

Suggested inspection urgency.

Allowed Values

```text
LOW
MEDIUM
HIGH
CRITICAL
UNKNOWN
```

Required

✅ Yes

---

## reasoningSummary

Short explanation describing why the issue was classified.

Maximum Length

300 characters

Required

✅ Yes

---

## limitations

Known uncertainties.

Examples

* Poor lighting
* Partial obstruction
* Blurry image
* Limited visibility

Type

```text
string[]
```

Required

✅ Yes

May be empty.

---

# Validation Rules

The Vision Provider must validate:

* Valid JSON
* Required fields present
* Enum values valid
* Arrays contain strings
* Strings within maximum length
* No unexpected object types

Invalid responses must not be forwarded to the runtime.

---

# Unknown Values

If Gemini cannot determine a field, use:

```text
UNKNOWN
```

Never omit required fields.

---

# Example Response

```json
{
  "issueType": "POTHOLE",
  "severity": "HIGH",
  "description": "Large pothole visible in the center of the roadway.",
  "observations": [
    "Standing water",
    "Broken asphalt"
  ],
  "potentialHazards": [
    "Vehicle damage",
    "Motorcycle safety risk"
  ],
  "infrastructure": "ROAD",
  "inspectionPriority": "HIGH",
  "reasoningSummary": "Visible structural damage indicates a hazardous road defect requiring prompt inspection.",
  "limitations": []
}
```

---

# Invalid Example

```json
{
  "type": "Pothole",
  "confidence": 98,
  "message": "Looks dangerous"
}
```

Reasons

* Incorrect field names
* Missing required fields
* Uses provider-specific output
* Contains unsupported confidence field
* Does not match VisionResult schema

---

# Schema Evolution

Future versions of VisionResult shall:

* Preserve existing required fields.
* Add only backward-compatible optional fields.
* Maintain compatibility with downstream runtime components.

Breaking changes require a new schema version.

---

# Success Criteria

The schema is considered complete when:

* Every Vision Provider returns a valid VisionResult.
* The Decision Engine consumes VisionResult without provider-specific logic.
* Responses are fully validated before entering the AI Runtime.
* Downstream components remain independent of Gemini implementation details.
* Future providers can replace Gemini without requiring runtime changes.

---

# Version

Schema Version

v1.0

Target Milestone

Milestone 5 — Phase 5A

This schema is the authoritative contract between perception and reasoning within the CityOps AI architecture.
