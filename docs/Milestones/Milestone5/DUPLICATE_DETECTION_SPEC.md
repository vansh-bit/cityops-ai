# DUPLICATE_REPORT_PROVIDER_SPEC.md

# Milestone 5 — Phase 5C

## Duplicate Report Provider Specification

---

# Purpose

This document defines the Duplicate Report Provider for CityOps AI.

The provider is responsible for determining whether a newly submitted municipal issue has already been reported.

Rather than allowing multiple identical reports to flood municipal systems, the provider supplies duplicate evidence to the AI Runtime.

Duplicate detection is an Evidence Provider.

It does not make decisions.

It only supplies evidence.

---

# Objective

Given:

- VisionResult
- Citizen location
- Municipality
- Existing reports

determine whether similar incidents already exist.

Return structured duplicate evidence.

---

# Runtime Position

Citizen Upload

↓

Gemini Vision

↓

VisionResult

↓

Decision Engine requests evidence

↓

Evidence Coordinator

↓

DuplicateReportProvider

↓

Firestore

↓

DuplicateEvidence

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

---

# Design Principles

The provider shall be:

- deterministic
- stateless
- independently testable
- provider isolated
- replaceable
- scalable

The provider performs searching.

The Decision Engine performs reasoning.

---

# Responsibilities

The provider shall:

- search nearby reports
- compare issue categories
- compare timestamps
- compare locations
- calculate duplicate confidence
- normalize results

The provider shall never:

- reject reports
- merge reports
- assign priorities
- determine confidence scores
- perform reasoning

---

# Search Strategy

The provider searches existing reports using:

## Municipality

Only reports from the same municipality are considered.

---

## Geographic Radius

Default search radius

250 meters

Future versions may support dynamic search radius.

---

## Issue Category

Candidate reports should match the same category.

Examples:

- pothole
- garbage
- broken streetlight
- fallen tree

---

## Time Window

Only active reports are considered.

Closed reports are ignored.

Default:

Previous 30 days.

---

# Duplicate Factors

Each candidate report contributes to a duplicate score.

Factors include:

- geographic distance
- issue category
- severity
- visual similarity (future)
- report age
- report status

---

# Duplicate Confidence

The provider returns:

LOW

MEDIUM

HIGH

rather than making a final duplicate decision.

Reasoning remains the responsibility of the Decision Engine.

---

# Canonical Schema

```typescript
interface DuplicateEvidence {

duplicateDetected: boolean;

confidence: "LOW" | "MEDIUM" | "HIGH";

matchingReports: DuplicateMatch[];

searchRadiusMeters: number;

searchDurationMs: number;

limitations: string[];

}
```

---

# DuplicateMatch

```typescript
interface DuplicateMatch {

reportId: string;

distanceMeters: number;

issueCategory: string;

severity: string;

createdAt: string;

status: string;

similarityScore: number;

}
```

---

# Evidence Contribution

The provider contributes evidence only.

Example

```
Duplicate Found

↓

3 Similar Reports

↓

HIGH Duplicate Confidence

↓

Decision Engine decides:

"Link citizen to existing report"

OR

"Create a new report"
```

The provider never performs this reasoning.

---

# Error Handling

Supported failures:

- Firestore unavailable
- timeout
- invalid municipality
- malformed records

Failures must never terminate runtime execution.

Return:

PARTIAL evidence.

---

# Retry Policy

Retry once for:

- timeout
- transient network failure

Do not retry:

- malformed data
- invalid request
- permission denied

---

# Logging

Log:

- requestId
- municipality
- search radius
- candidate reports
- duplicate confidence
- execution duration

Never log:

- citizen personal information
- authentication credentials

---

# Performance

Target:

Average execution

<1 second

Maximum

3 seconds

---

# Testing Requirements

Verify:

- no duplicates
- one duplicate
- multiple duplicates
- expired reports
- closed reports
- timeout
- Firestore failure
- partial evidence

---

# Future Extensions

Future versions may include:

- image similarity
- Gemini embedding similarity
- semantic similarity
- citizen clustering
- duplicate merging
- report voting
- report subscriptions

---

# Acceptance Criteria

Implementation is complete when:

- Nearby reports are discovered.
- DuplicateEvidence is generated.
- EvidencePackage includes duplicate evidence.
- Runtime remains unchanged.
- Decision Engine consumes DuplicateEvidence.
- Automated tests pass.

---

# Success Criteria

The Duplicate Report Provider is successful when the AI Runtime can determine whether a municipal issue has likely been reported already without coupling duplicate detection logic to the Decision Engine.

The provider should become a reusable evidence source that improves report quality, reduces duplicate submissions, and enhances the citizen experience.

---

# Version

Specification Version

v1.0

Target Milestone

Milestone 5 – Phase 5C