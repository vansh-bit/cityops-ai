# Milestone 2 — Authentication & Cloud Infrastructure

**Status:** Ready for Engineering

**Project:** CityOps AI

---

# Objective

Establish the authentication and cloud security foundation for CityOps AI.

This milestone enables the backend to securely identify users, authorize access, and communicate with Google Cloud services while preserving the locked architecture.

At the end of this milestone:

* Shared workspace is fully integrated.
* Firebase Authentication is operational.
* JWT verification is implemented.
* Authentication middleware is complete.
* Authorization middleware is complete.
* Backend request context supports authenticated users.
* Cloud security configuration is complete.
* Authentication tests pass.

No business functionality should exist.

---

# Relevant PROJECT_SPEC Chapters

## Mandatory

### Chapter 2 – Part A

Purpose

* Backend architecture
* Google Cloud architecture
* Component boundaries
* Service responsibilities

---

### Chapter 3 – Part D

Purpose

* Security model
* Authentication assumptions
* Authorization responsibilities
* Cloud Storage security
* Reliability principles

---

### Chapter 4 – Part A

Purpose

* API philosophy
* Authentication model
* Authorization model
* API conventions

---

## Reference Only

### Chapter 3 – Part E

Engineering constraints and performance expectations.

### Chapter 4 – Part C

Backend contracts and engineering standards.

---

# Prerequisite

Before beginning authentication implementation:

Complete the repository integration identified during the Milestone 1 review.

Specifically:

* Configure the project as a proper monorepo/workspace.
* Ensure the `shared/` package can be imported by both the backend and frontend.
* Verify shared types compile correctly.

This is a required prerequisite before continuing.

---

# Included Scope

Implement only:

## Repository Integration

* Shared workspace linkage
* Shared package resolution
* Shared type compilation

---

## Authentication

* Firebase Authentication integration
* Firebase Admin verification
* JWT verification
* Authentication service
* Authentication middleware
* Request user context

---

## Authorization

* Citizen role support
* Authority role support
* Role middleware
* Permission middleware
* Protected route infrastructure

---

## Cloud Infrastructure

* Secure Firebase initialization
* Secure Firestore initialization
* Secure Cloud Storage initialization
* Authentication configuration

---

## Shared Contracts

* Authentication types
* User types
* Role enums
* Permission definitions

---

## Testing

* Authentication tests
* Authorization tests
* Middleware tests
* Invalid token tests
* Expired token tests

---

# Explicitly Out of Scope

Do NOT implement:

* AI Decision Engine
* Vision Module
* Tool Registry
* Firestore collections
* Firestore schemas
* Report upload
* Citizen workflow
* Authority dashboard
* Human review
* Business endpoints
* Duplicate detection
* Embeddings
* Prompt engineering

If scaffolding is required for future milestones, create only the minimum required structure.

---

# Deliverables

The following should exist after this milestone:

* Shared workspace fully connected
* Firebase Authentication integration
* Authentication middleware
* Authorization middleware
* Shared authentication contracts
* Cloud security configuration
* Authentication documentation
* Passing authentication tests

---

# Acceptance Criteria

The milestone is successful only if all of the following are true:

* Shared package imports successfully from backend.
* Shared package imports successfully from frontend.
* Firebase Authentication initializes successfully.
* Backend validates Firebase ID tokens.
* User identity is available throughout authenticated requests.
* Authorization middleware correctly enforces user roles.
* Unauthorized requests are rejected.
* Invalid tokens are rejected.
* Expired tokens are rejected.
* Backend builds successfully.
* Frontend builds successfully.
* Tests pass.
* No business functionality has been implemented.

---

# Technical Requirements

Authentication Provider

* Firebase Authentication

Identity

* Firebase ID Tokens

Authorization

* Role-based access control

Supported Roles

* Citizen
* Authority

Cloud Services

* Firebase Authentication
* Firestore
* Cloud Storage

Configuration

* Environment variables only
* No hardcoded credentials
* Secure initialization

---

# Testing Requirements

## Unit Tests

* Authentication service
* JWT verification
* Permission checks
* Role validation

---

## Integration Tests

* Authenticated request
* Missing token
* Invalid token
* Expired token
* Authority-only access
* Citizen-only access

---

## Manual Verification

Verify:

* Firebase Authentication initializes.
* Backend starts successfully.
* Frontend starts successfully.
* Authenticated requests succeed.
* Unauthorized requests fail.
* Forbidden requests fail.

---

## Failure Scenarios

Test:

* Missing Firebase credentials
* Invalid Firebase credentials
* Invalid JWT
* Expired JWT
* Firebase unavailable

System should fail safely with meaningful error messages.

---

# Common Implementation Mistakes

Avoid:

* Implementing business logic.
* Creating Firestore collections.
* Implementing report upload.
* Adding API endpoints unrelated to authentication.
* Mixing authentication with authorization.
* Hardcoding roles.
* Hardcoding Firebase configuration.
* Allowing frontend authorization decisions.

---

# Definition of Done

Milestone 2 is complete only if:

* Shared workspace is operational.
* Authentication is fully functional.
* Authorization is fully functional.
* Cloud security foundation exists.
* Tests pass.
* Architecture remains unchanged.
* No business features have been implemented.

---

# Expected Deliverables

When complete, generate:

`IMPLEMENTATION_REVIEW_PACKAGE.md`

Include:

* Repository changes
* Files created
* Files modified
* Dependencies added
* Configuration changes
* Environment variables
* Build verification
* Test results
* Known issues
* Architectural deviations

If there are no deviations, explicitly state:

> No architectural deviations.

Stop after generating the report.

Do not begin Milestone 3.
