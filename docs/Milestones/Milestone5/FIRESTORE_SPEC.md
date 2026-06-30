# FIRESTORE_SPEC.md

# Milestone 5 — Phase 5C

## Firestore Persistence Specification

---

# Purpose

This document defines the production Firestore persistence architecture for CityOps AI.

Its purpose is to provide a reliable, scalable, and provider-independent mechanism for permanently storing completed municipal incident reports after AI analysis has successfully completed.

Firestore is responsible only for persistence.

It must never participate in AI reasoning, evidence collection, or runtime decision making.

---

# Architectural Role

The Firestore Provider belongs exclusively to the Persistence Layer.

```
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

The Firestore Provider consumes completed runtime outputs.

It does not modify them.

---

# Responsibilities

The Firestore Provider shall:

- create new incident reports
- persist completed runtime outputs
- store metadata
- store timestamps
- associate the canonical Cloud Storage object path
- associate the generated Tracking ID
- return persistence confirmation

The provider shall never:

- execute AI reasoning
- modify runtime outputs
- communicate directly with Gemini
- communicate directly with Google Maps
- calculate confidence
- perform duplicate detection

---

# Firestore Collection

Collection Name

```
reports
```

Each submitted report shall create exactly one Firestore document.

---

# Document ID Strategy

The Firestore document SHALL use the Tracking ID as its document identifier.

This establishes a one-to-one relationship between:

- Tracking ID
- Firestore document
- Cloud Storage directory

---

# Document Structure

Each report document shall contain:

```
trackingId

createdAt

submittedAt

status

location

visionResult

evidencePackage

decision

confidence

municipalityReport

image (storage object path)

metadata
```

The Firestore document shall preserve the runtime outputs exactly as generated.

---

# Required Fields

Every report shall contain:

- Tracking ID (as the document ID)
- submission timestamp
- runtime timestamp
- canonical storage object path
- municipality
- AI decision
- confidence score
- municipality report

Documents missing required fields shall not be persisted.

---

# Metadata

Metadata shall include:

- runtime version
- submission source
- report version
- persistence timestamp
- schema version

Future metadata may be added without breaking compatibility.

---

# Persistence Flow

```
Municipality Report
        ↓
Persistence Coordinator
        ↓
Tracking ID Generator
        ↓
Tracking ID Returned
        ↓
Cloud Storage Provider
        ↓
Storage Object Path Returned
        ↓
Firestore Provider
        ↓
Create Report Document using Tracking ID
        ↓
Return Confirmation
        ↓
Submission Response
```

Firestore persistence begins only after successful image upload.

---

# Runtime Integration

The Persistence Coordinator owns orchestration.

The Firestore Provider receives:

- Municipality Report
- VisionResult
- EvidencePackage
- Decision
- Confidence
- Canonical storage object path
- Tracking ID

The provider writes these objects to Firestore without modification.

---

# Document Lifecycle

Document States

```
CREATED

↓

SUBMITTED

↓

ACKNOWLEDGED
```

Future milestones may introduce additional workflow states.

Phase 5C shall only create newly submitted reports.

---

# Validation

Before persistence verify:

- Tracking ID exists
- Storage object path exists
- Municipality Report exists
- Firestore payload is complete
- Required metadata exists

Invalid payloads shall never be written.

---

# Firestore Size Constraints

Firestore enforces a 1 MB maximum document size limit.

Runtime outputs (including the evidencePackage and visionResult) must remain comfortably below this limit. Future large payloads shall be stored separately if required.

---

# Firestore Indexing

The following fields require indexing to support future query access patterns:

- `trackingId`
- `createdAt`
- `municipality`
- `submissionStatus`

Future composite indexes may be added as needed.

---

# Error Handling

Possible failures include:

- Firestore unavailable
- permission denied
- invalid payload
- timeout
- network interruption

Failures shall return structured persistence errors.

If Firestore persistence fails after Cloud Storage upload, the coordinator must roll back the image upload, log a structured failure (including Tracking ID and storage object reference), and return a structured persistence error.

If the rollback itself fails, return `PERSISTENCE_ROLLBACK_FAILED` and log for manual remediation. Never leave behaviour undefined.

Partial Firestore writes are prohibited.

---

# Atomicity

Persistence shall behave atomically.

Either:

- report successfully persists

or

- persistence fails

No partially written reports shall exist.

---

# Logging

Structured logging shall include:

- persistence started
- Firestore connection established
- document creation
- document ID generated
- persistence completed
- execution duration
- errors
- rollback failures

Sensitive information must never be logged.

---

# Security Requirements

The Firestore Provider shall:

- use Firebase Admin SDK
- authenticate using server credentials
- never expose credentials
- never expose internal document paths
- validate payloads before persistence

Firestore operations shall execute only on the backend.

---

# Performance Requirements

Target Firestore write latency:

```
< 1s
```

Persistence shall not noticeably increase total runtime latency.

---

# Testing Requirements

Testing shall verify:

- successful document creation
- invalid payload rejection
- timeout handling
- permission failures
- retry behaviour (where applicable)
- metadata persistence
- Tracking ID association
- image storage path association

Automated tests are mandatory.

---

# Future Compatibility

Future milestones may extend reports with:

- duplicate report references
- municipality workflow status
- citizen feedback
- notifications
- audit history
- administrative actions

Existing document fields shall remain backward compatible.

---

# Implementation Constraints

Do NOT:

- redesign runtime architecture
- modify runtime outputs
- persist incomplete reports
- expose Firestore implementation details
- tightly couple Firestore to business logic

Firestore shall remain isolated behind the FirestoreProvider abstraction.

---

# Acceptance Criteria

The Firestore Provider is considered complete when:

- reports are successfully persisted
- document schema is consistent
- Tracking IDs are associated correctly and used as Document IDs
- image storage paths are stored correctly
- structured errors are returned
- automated tests pass
- runtime architecture remains unchanged

---

# Definition of Success

The Firestore Provider successfully persists every completed municipality report as an immutable Firestore document while preserving the outputs generated by the AI Runtime.

Persistence shall be reliable, atomic, scalable, and fully isolated from runtime reasoning.

---

# Version

Specification Version

v1.1

Target Milestone

Milestone 5 — Phase 5C

This document is the authoritative specification governing Firestore persistence for CityOps AI.