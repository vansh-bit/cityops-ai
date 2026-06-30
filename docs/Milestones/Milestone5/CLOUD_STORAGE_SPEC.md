# CLOUD_STORAGE_SPEC.md

# Milestone 5 — Phase 5C

## Cloud Storage Specification

---

# Purpose

This document defines the production Cloud Storage architecture for CityOps AI.

Its purpose is to provide secure, reliable, and scalable storage for citizen-uploaded incident images.

Cloud Storage is responsible only for image persistence.

It must never participate in AI reasoning, evidence collection, decision making, or report generation.

---

# Architectural Role

The Cloud Storage Provider belongs exclusively to the Persistence Layer.

```
Municipality Report
        ↓
Persistence Coordinator
        ↓
Tracking ID Generator
        ↓
Cloud Storage Provider
        ↓
Firebase Cloud Storage
        ↓
Firestore Provider
        ↓
Submission Response
```

The Cloud Storage Provider stores uploaded images and returns a permanent canonical storage path.

---

# Responsibilities

The Cloud Storage Provider shall:

- upload incident images
- generate permanent canonical storage paths
- associate uploaded images with reports via Tracking IDs
- validate uploads
- preserve upload metadata
- return upload confirmation

The provider shall never:

- perform AI analysis
- modify uploaded images
- communicate directly with Gemini
- communicate directly with Google Maps
- generate reports
- perform duplicate detection

---

# Storage Structure

Storage Bucket

The bucket name shall not be hardcoded. Bucket configuration shall be environment driven.
Buckets remain private by default.

Directory Structure

```
reports/

    {trackingId}/

        original.<extension>
```

Every report shall have its own dedicated storage directory.

Images shall never be overwritten.

---

# File Naming

The uploaded image shall be stored as:

```
reports/{trackingId}/original.<extension>
```

Supported extensions:

- jpg
- jpeg
- png
- webp

The original file extension shall be preserved.

---

# Maximum File Size

Maximum upload size:

```
10 MB
```

---

# Upload Flow

```
Persistence Coordinator
        ↓
Tracking ID Generated
        ↓
Cloud Storage Provider
        ↓
Image Validation
        ↓
Firebase Cloud Storage
        ↓
Canonical Storage Path Generated
        ↓
Firestore Provider
```

Cloud Storage upload shall complete before Firestore persistence begins.

---

# Upload Validation

Before upload verify:

- image exists
- supported format
- file size within 10 MB limit
- upload request valid

Invalid uploads shall never reach Cloud Storage.

---

# Metadata

Each uploaded image shall store metadata including:

- tracking ID
- upload timestamp
- MIME type
- original filename
- file size
- uploader source
- schema version

Future metadata may be added without breaking compatibility.

---

# Storage Response & URL Strategy

The Cloud Storage Provider shall return:

- upload status
- canonical storage path (e.g., `gs://bucket-name/reports/{trackingId}/original.jpg`)
- upload timestamp

Do NOT implement publicly readable buckets. Cloud Storage stores the canonical object, and Firestore stores the canonical storage object path. Application-generated signed URLs or authorized access mechanisms must be used whenever image retrieval is required by clients.

---

# Runtime Integration

The Persistence Coordinator owns orchestration.

The Cloud Storage Provider receives:

- uploaded image
- Tracking ID
- upload metadata

The provider returns:

- canonical storage path
- upload confirmation

No Cloud Storage implementation details shall propagate beyond the provider boundary.

---

# Error Handling & Rollback Behaviour

Possible failures include:

- upload timeout
- invalid file
- unsupported format
- bucket unavailable
- permission denied
- network interruption

Failures shall return structured persistence errors. Image upload failure shall prevent Firestore persistence.

**Rollback Behaviour:**
If Firestore persistence fails after Cloud Storage upload completes:
- rollback image upload (delete the orphaned image from Cloud Storage)
- log structured failure
- log storage object reference
- log Tracking ID
- return structured persistence error

If the rollback itself fails:
- return `PERSISTENCE_ROLLBACK_FAILED`
- log for manual remediation
- never leave behaviour undefined

---

# Atomicity

Persistence shall behave atomically.

Either:

- image uploads successfully and report persists successfully

or

- neither operation completes successfully.

The system shall never persist a report referencing a missing image.

---

# Logging

Structured logging shall include:

- upload started
- validation completed
- upload completed
- canonical storage path generated
- upload duration
- errors
- rollback executions

Sensitive information must never be logged.

---

# Security Requirements

The Cloud Storage Provider shall:

- use Firebase Admin SDK
- authenticate using server credentials
- never expose service account credentials
- validate uploaded files
- reject unsupported formats
- prevent unauthorized uploads
- ensure buckets are private by default

Uploads shall execute only on the backend.

---

# Performance Requirements

Target upload latency:

```
< 2s
```

The upload process should not significantly increase total runtime latency.

---

# Testing Requirements

Testing shall verify:

- successful upload
- unsupported file rejection
- oversized file rejection
- timeout handling
- permission failures
- metadata persistence
- canonical storage path generation

Automated tests are mandatory.

---

# Future Compatibility

Future milestones may extend Cloud Storage with:

- image thumbnails
- multiple image uploads
- annotated AI images
- version history
- archival storage
- CDN optimization

Existing upload behaviour shall remain backward compatible.

---

# Implementation Constraints

Do NOT:

- redesign runtime architecture
- expose Cloud Storage internals
- overwrite existing uploads
- modify uploaded image content
- tightly couple Cloud Storage to business logic
- make storage buckets publicly readable

Cloud Storage shall remain isolated behind the CloudStorageProvider abstraction.

---

# Acceptance Criteria

The Cloud Storage Provider is considered complete when:

- images upload successfully to a private environment-driven bucket
- canonical storage paths are generated and returned
- upload metadata is preserved
- uploads are validated (10 MB max)
- structured errors are returned
- rollback behaviour is successfully executed on persistence failures
- automated tests pass
- runtime architecture remains unchanged

---

# Definition of Success

The Cloud Storage Provider successfully stores every citizen-uploaded incident image in a secure, private bucket, generates a permanent canonical storage path, and provides that reference to the Persistence Layer while remaining completely isolated from AI reasoning and runtime decision making.

---

# Version

Specification Version

v1.1

Target Milestone

Milestone 5 — Phase 5C

This document is the authoritative specification governing image persistence for CityOps AI.