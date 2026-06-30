# TRACKING_ID_SPEC.md

# Milestone 5 — Phase 5C

## Tracking ID Generation Specification

---

# Purpose

This document defines the generation, lifecycle, validation, and management of Tracking IDs within CityOps AI.

The Tracking ID uniquely identifies every successfully submitted municipal incident report.

Its primary purpose is to provide a stable reference that allows reports to be retrieved, tracked, and referenced throughout future workflow stages.

Tracking IDs are generated prior to cloud storage upload and firestore persistence, serving as the canonical identifier across the persistence layer.

---

# Architectural Role

The Tracking ID Generator belongs exclusively to the Persistence Layer.

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

The Tracking ID Generator does not perform persistence.

It generates identifiers consumed by the Persistence Coordinator.

---

# Responsibilities

The Tracking ID Generator shall:

- generate globally unique tracking IDs
- guarantee uniqueness
- ensure identifiers are cryptographically secure, random, non-enumerable, and URL-safe
- produce immutable identifiers
- provide IDs to both Cloud Storage and Firestore
- return IDs in the submission response

The Tracking ID Generator shall never:

- upload files
- write Firestore documents
- execute AI reasoning
- perform duplicate detection
- modify runtime outputs

---

# Tracking ID Format & Strategy

Tracking IDs SHALL be:

- cryptographically secure
- random
- non-enumerable
- globally unique
- URL-safe
- immutable

Do NOT prescribe a specific algorithm (such as UUID, NanoID, etc.). The exact generation strategy is implementation-defined provided all above characteristics are guaranteed.

The use of sequential identifiers (e.g., `CTS-YYYY-00000123`) is strictly prohibited to prevent report enumeration.

Tracking IDs shall never be reused.

---

# Firestore Document ID Strategy

The Firestore document SHALL use the Tracking ID as its document identifier.

This establishes a one-to-one relationship between:

- Tracking ID
- Firestore document
- Cloud Storage directory

---

# Generation Rules

Tracking IDs shall be generated only after:

- AI analysis completes
- Evidence collection completes
- Municipality report generation completes

Tracking IDs shall be generated before:

- Cloud Storage upload
- Firestore persistence

The same Tracking ID shall be used consistently throughout the persistence workflow.

---

# Runtime Flow

```
Municipality Report
        ↓
Persistence Coordinator
        ↓
Tracking ID Generator
        ↓
Tracking ID Generated
        ↓
Cloud Storage Upload
        ↓
Firestore Persistence (using Tracking ID as Document ID)
        ↓
Submission Response
```

The Tracking ID becomes the primary identifier for the report.

---

# Association

Each Tracking ID shall be associated with:

- Firestore document (as the Document ID)
- Cloud Storage image directory
- Municipality Report
- Submission metadata
- Runtime metadata

Future services shall reference reports using the Tracking ID.

---

# Validation

Before persistence verify:

- Tracking ID exists
- Tracking ID matches the required characteristics (URL-safe, non-enumerable)
- Tracking ID has not already been assigned

Invalid Tracking IDs shall prevent persistence.

---

# Submission Response

Successful report submission shall return:

```
{
    "trackingId": "...",
    "submissionStatus": "SUBMITTED",
    "timestamp": "...",
    "message": "Report submitted successfully."
}
```

The Tracking ID shall always be included in successful responses.

---

# Error Handling

Possible failures include:

- ID generation failure
- duplicate identifier detected

Failures shall return structured persistence errors.

Persistence shall not continue without a valid Tracking ID.

---

# Logging

Structured logging shall include:

- Tracking ID generation started
- Tracking ID generated
- Tracking ID associated with report
- generation duration
- errors

Tracking IDs may be logged.

Sensitive runtime information shall never be logged alongside them.

---

# Security Requirements

Tracking IDs shall:

- reveal no sensitive user information
- reveal no database identifiers
- reveal no internal architecture
- be safe for public sharing
- be non-enumerable (not predictable enough to enumerate reports)

---

# Performance Requirements

Target Tracking ID generation latency:

```
< 50ms
```

Tracking ID generation shall have negligible impact on overall runtime.

---

# Testing Requirements

Testing shall verify:

- valid Tracking ID generation
- uniqueness
- non-enumerability
- URL-safe formatting
- duplicate prevention
- Firestore association
- Cloud Storage association
- API response inclusion

Automated tests are mandatory.

---

# Future Compatibility

Future milestones may extend Tracking IDs with:

- report status lookup
- citizen report tracking
- municipality workflow tracking
- notification systems
- audit history
- public status portal

Existing Tracking IDs shall remain valid.

---

# Implementation Constraints

Do NOT:

- generate multiple Tracking IDs for a single report
- modify Tracking IDs after generation
- expose internal database identifiers
- tightly couple Tracking ID generation to Firestore implementation
- use sequential identifiers

Tracking ID generation shall remain isolated behind the Tracking ID Generator.

---

# Acceptance Criteria

The Tracking ID Generator is considered complete when:

- every submitted report receives a unique Tracking ID prior to persistence
- IDs conform to the specified cryptographic and non-enumerable characteristics
- IDs are used as the Cloud Storage directory and Firestore Document ID
- IDs are returned to the frontend
- automated tests pass
- runtime architecture remains unchanged

---

# Definition of Success

The Tracking ID Generator provides every successfully submitted municipal incident report with a unique, immutable, and cryptographically secure identifier that serves as the canonical reference for persistence, future tracking, and system integration.

---

# Version

Specification Version

v1.1

Target Milestone

Milestone 5 — Phase 5C

This document is the authoritative specification governing Tracking ID generation and management for CityOps AI.