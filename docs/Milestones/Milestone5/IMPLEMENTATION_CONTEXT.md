# IMPLEMENTATION_CONTEXT.md

# Milestone 5 — Phase 5C

## Implementation Context

---

# Supporting Engineering Specifications

The following documents provide the engineering specifications required to implement Phase 5C.

- FIRESTORE_SPEC.md
- CLOUD_STORAGE_SPEC.md
- TRACKING_ID_SPEC.md
- API_CONTRACT.md
- ERROR_HANDLING.md
- TEST_PLAN.md

# Purpose

This document defines the implementation boundaries, architectural constraints, engineering objectives, and acceptance criteria for Milestone 5 – Phase 5C.

Phase 5C introduces the **Persistence Layer** to CityOps AI. 
The objective is to permanently store completed municipal incident reports using Firebase Cloud Storage and Firestore while generating a globally unique Tracking ID.

The core AI runtime architecture validated during Phase 5A and Phase 5B remains unchanged and fully isolated from the Persistence Layer.

---

# Phase Objective

Implement the Persistence Layer consisting of the Persistence Coordinator, Tracking ID Generator, Cloud Storage Provider, and Firestore Provider. 

Persistence begins ONLY after Municipality Report generation. No runtime reasoning shall occur inside the Persistence Layer.

---

# Primary Goal

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
EvidencePackage
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

---

# Architectural Principles

The following principles are mandatory.

## Principle 1
The AI Runtime is architecturally complete. Do not redesign it.

## Principle 2
Persistence logic (Cloud Storage, Firestore) must be strictly isolated behind Provider abstractions.

## Principle 3
No AI reasoning or evidence collection shall occur inside the Persistence Layer.

## Principle 4
Persistence must be atomic. Either the image and report both persist successfully, or neither persists. The runtime shall never persist partial reports.

---

# Implementation Scope

## Included

- Persistence Coordinator
- Tracking ID Generator
- Cloud Storage Provider
- Firestore Provider
- Submission Response Generation
- Atomic persistence orchestration
- Logging and Error Handling
- Automated testing

## Explicitly Excluded

- Duplicate Detection
- Authentication
- Notifications
- Dashboards
- User Accounts
- Analytics
- Municipality Workflow
- Report Tracking Portal

---

# Components Expected

The implementation should introduce or complete the following logical components.

## Backend

- `PersistenceCoordinator`: Orchestrates the persistence workflow.
- `TrackingIdGenerator`: Generates `CTS-YYYY-XXXXXXXX` identifiers.
- `CloudStorageProvider`: Uploads the image and returns a permanent URL.
- `FirestoreProvider`: Creates the single immutable report document containing all runtime outputs.

## Infrastructure

- Firebase Admin SDK configuration
- Cloud Storage Buckets
- Firestore Database initialization
- Structured logging

---

# Persistence Layer Architecture

The Persistence Layer handles the final step of the report lifecycle. 

The `PersistenceCoordinator` receives the completed runtime outputs (VisionResult, EvidencePackage, Decision, Confidence, Municipality Report, and the uploaded image buffer).

It executes the following flow:
1. Calls `TrackingIdGenerator` to obtain a unique Tracking ID.
2. Calls `CloudStorageProvider` to upload the image buffer and retrieve a storage URL.
3. Calls `FirestoreProvider` to save the comprehensive report document (including the storage URL and Tracking ID).
4. Returns the final `SubmissionResponse` to the API layer.

The Persistence Layer shall never modify the runtime outputs. It only persists them.

---

# API Contract

Frontend and backend communication SHALL conform to the extended contract defined in `API_CONTRACT.md`.

This includes returning the newly introduced fields:
- `trackingId`
- `submissionStatus`
- `storageUrl` (internal/public)

The contract clearly distinguishes the difference between raw Analysis output and a Successful Submission Response.

---

# Logging Requirements

Structured logging shall include:

- Persistence started
- Tracking ID generated
- Cloud Storage upload completed
- Firestore document created
- Persistence completed
- Execution duration
- Persistence rollback/failures

---

# Testing Requirements

Testing shall verify:

- Cloud Storage uploads
- Firestore document creation
- Tracking ID generation and uniqueness
- Persistence Coordinator orchestration
- Atomic persistence verification
- Rollback verification on failure
- Error handling (Permissions, Network, Timeouts)

Implementation is considered complete only when all acceptance criteria defined in `TEST_PLAN.md` have been satisfied.

---

# Implementation Constraints

The following are mandatory.

DO NOT:

* redesign the Vision, Evidence, Decision, or Confidence layers.
* persist partial reports (missing image or missing document).
* expose Firestore or Cloud Storage implementation details to the frontend.
* tightly couple persistence to the AI business logic.
* introduce out-of-scope features.

Implementation quality is more important than implementation speed. Maintain the architectural discipline established throughout previous milestones.

---

# Deliverables

Implementation is expected to produce:

- Persistence Coordinator
- Tracking ID Generator
- Cloud Storage Provider
- Firestore Provider
- Automated tests verifying atomic persistence
- Error Handling updates

# Definition of Success

Phase 5C is successful when CityOps AI reliably and atomically stores successfully analyzed citizen reports in Firestore with associated Cloud Storage imagery and a unique Tracking ID.

Success is measured by the seamless addition of the Persistence Layer without compromising the stability, speed, or modularity of the existing AI runtime.
