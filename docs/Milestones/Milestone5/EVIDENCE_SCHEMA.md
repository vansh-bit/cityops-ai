# EVIDENCE_SCHEMA.md

# Milestone 5 — Phase 5B

## Evidence Package Schema Specification

---

# Purpose

This document defines the canonical **EvidencePackage** schema used throughout the CityOps AI Runtime.

The Evidence Package represents all contextual information collected from external evidence providers after the initial image analysis has been completed.

It is the primary input consumed by the Decision Engine during reasoning.

All Evidence Providers must normalize their outputs into this schema before evidence reaches the AI Runtime.

---

# Objective

The purpose of the Evidence Package is to allow the AI to reason using verified external evidence rather than relying solely on visual perception.

Instead of making decisions from an uploaded image alone, the runtime gathers supporting evidence from multiple providers before producing a final municipal recommendation.

---

# Runtime Position

```text
Citizen Upload
        ↓
Gemini Vision
        ↓
VisionResult
        ↓
Decision Engine
        ↓
Evidence Request
        ↓
Evidence Coordinator
        ↓
Evidence Providers
        ↓
Evidence Aggregator
        ↓
EvidencePackage
        ↓
Decision Engine
        ↓
Confidence Engine
        ↓
Municipality Report
```

The Decision Engine consumes only the normalized EvidencePackage.

Provider-specific response formats are prohibited beyond the Evidence Layer.

---

# Design Principles

The Evidence Package shall be:

* Provider independent
* Strongly typed
* Extensible
* Immutable after aggregation
* Easy to validate
* Independent of Google APIs

The Decision Engine must never consume Google Maps, Places, or external API responses directly.

---

# Canonical Schema

```typescript
interface EvidencePackage {

    requestId: string;

    collectedAt: string;

    overallStatus: EvidenceStatus;

    providers: ProviderStatus[];

    location?: LocationEvidence;

    municipality?: MunicipalityEvidence;

    infrastructure?: InfrastructureEvidence;

    metadata: EvidenceMetadata;

    limitations: string[];
}
```

---

# Schema Components

## requestId

Unique runtime identifier.

Type

```text
string
```

Required

✅ Yes

---

## collectedAt

Timestamp indicating when evidence collection completed.

Type

```text
ISO-8601 String
```

Required

✅ Yes

---

## overallStatus

Overall evidence collection status.

Allowed Values

```text
VALID

PARTIAL

ERROR
```

Required

✅ Yes

---

## providers

Execution summary for every evidence provider.

Each provider includes:

* provider name
* execution status
* duration
* error (if any)

Required

✅ Yes

---

# LocationEvidence

```typescript
interface LocationEvidence {

latitude: number;

longitude: number;

formattedAddress: string;

locality: string;

city: string;

district: string;

state: string;

country: string;

postalCode: string;

}
```

Purpose

Represents normalized geographical information.

---

# MunicipalityEvidence

```typescript
interface MunicipalityEvidence {

municipalityName: string;

jurisdiction: string;

administrativeArea: string;

responsibleAuthority: string;

}
```

Purpose

Identifies the government authority responsible for the reported issue.

---

# InfrastructureEvidence

```typescript
interface InfrastructureEvidence {

roadType: string;

nearbyLandmarks: string[];

nearbyPublicInfrastructure: string[];

accessibility: string;

}
```

Examples

* School
* Hospital
* Traffic Signal
* Park
* Government Office



# EvidenceMetadata

```typescript
interface EvidenceMetadata {

collectionDurationMs: number;

providerCount: number;

successfulProviders: number;

failedProviders: number;

}
```

Purpose

Provides runtime telemetry.

The Decision Engine shall not reason using this object.

---

# Provider Status

```typescript
interface ProviderStatus {

provider: string;

status: "VALID" | "PARTIAL" | "ERROR";

durationMs: number;

error?: string;

}
```

Used for:

* logging
* telemetry
* debugging
* runtime monitoring

---

# Validation Rules

Every Evidence Package must satisfy:

* requestId present
* timestamp present
* provider list present
* location normalized
* municipality resolved where possible
* metadata populated
* status valid

Invalid Evidence Packages must never reach the Decision Engine.

---

# Partial Evidence

Evidence collection is allowed to succeed partially.

Example:

```text
Gemini Vision

✓

Google Maps

✗

Overall Status

PARTIAL
```

The runtime shall continue whenever sufficient evidence exists.

---

# Error Handling

Evidence providers may fail independently.

Failures must not terminate the runtime.

Failed providers shall contribute:

* provider status
* error reason
* execution duration

The remaining evidence shall continue to be processed.

---

# Schema Evolution

Future providers may extend the Evidence Package with:

* weather
* traffic
* road closures
* utility outages
* municipal assets
* environmental conditions
* emergency alerts

New fields shall remain backward compatible.

Existing fields shall not be removed without version changes.

---

# Testing Requirements

Verify:

* complete evidence collection
* partial provider failures
* missing municipality
* invalid coordinates
* provider timeout
* aggregation correctness
* schema validation

---

# Acceptance Criteria

The schema is accepted when:

* Every provider returns normalized evidence.
* The Evidence Aggregator produces a valid EvidencePackage.
* The Decision Engine consumes only the EvidencePackage.
* No provider-specific response formats leak into runtime.
* Partial failures are supported.
* All validation rules pass.

---

# Success Criteria

The Evidence Package is successful when it becomes the single source of contextual truth for the AI Runtime.

Every downstream component should reason using this unified schema rather than interacting with individual evidence providers.

This enables CityOps AI to remain modular, extensible, and independent of any specific external service.

---

# Version

Schema Version

v1.0

Target Milestone

Milestone 5 – Phase 5B

This document is the authoritative schema specification governing evidence exchange within the CityOps AI Runtime.
