# IMPLEMENTATION_CONTEXT.md

# Milestone 5 — Phase 5A

## Implementation Context

---

# Supporting Engineering Specifications

This document defines architectural constraints and implementation boundaries.

The following documents provide the engineering specifications required to implement Phase 5A.

- GEMINI_PROMPT_SPEC.md
- VISION_RESULT_SCHEMA.md
- API_CONTRACT.md
- ERROR_HANDLING.md
- TEST_PLAN.md

These documents are considered normative.

Where conflicts exist, these engineering specifications take precedence over implementation assumptions.

# Purpose

This document defines the implementation boundaries, architectural constraints, engineering objectives, and acceptance criteria for **Milestone 5 – Phase 5A**.

Its purpose is to ensure implementation remains fully aligned with the architecture established during Milestones 1–4 while integrating the first production AI capability into CityOps AI.

This document is **implementation guidance**, not a design specification.

---

# Phase Objective

Replace the simulated Vision Provider with a production Gemini Vision implementation while preserving the existing AI Runtime architecture.

The end result should allow a user to upload a real image and receive a complete AI-generated municipal incident assessment using the existing runtime pipeline.

No architectural redesign is permitted.

---

# Primary Goal

Current workflow:

Citizen Upload

↓

Mock Vision Provider

↓

Decision Engine

↓

Evidence Layer

↓

Confidence Engine

↓

Municipality Report

Target workflow:

Citizen Upload

↓

Gemini Vision

↓

Structured Vision Analysis

↓

Decision Engine

↓

Evidence Layer

↓

Confidence Engine

↓

Municipality Report

Only the Vision Provider changes.

Everything downstream continues operating exactly as designed.

---

# Architectural Principles

The following principles are mandatory.

## Principle 1

The AI Runtime is considered architecturally complete.

Do not redesign it.

---

## Principle 2

Existing interfaces must remain compatible.

Production services should replace implementations—not contracts.

---

## Principle 3

The Decision Engine must never communicate directly with Gemini.

Communication must continue through the existing provider architecture.

---

## Principle 4

The Confidence Engine remains unchanged.

Its inputs may improve because production evidence is available, but its logic is not modified during Phase 5A.

---

## Principle 5

Evidence Orchestration remains unchanged.

Only the Vision Provider implementation changes.

## Principle 6

Production integrations shall remain replaceable.

External services (Gemini, Google Maps, Firebase) must remain encapsulated behind provider abstractions so that implementations can be replaced without affecting downstream runtime components.

---

# Implementation Scope

## Included

* Google Gemini 2.5 Flash Vision integration using the official Google Gen AI SDK.

Model selection and prompt engineering are defined in:

GEMINI_PROMPT_SPEC.md

* Production Vision Provider
* Image upload
* Runtime integration
* Structured response parsing according to the canonical VisionResult schema defined in

VISION_RESULT_SCHEMA.md
* Validation
* Error handling
* Logging
* Testing

---

## Explicitly Excluded

Do NOT implement:

* Firestore
* Cloud Storage
* Google Maps
* Municipality Dashboard
* Authentication
* Notifications
* Analytics
* Role management
* Report persistence

These belong to later phases.

---

# Components Expected

The implementation should introduce or complete the following logical components.

## Frontend

* Upload interface
* Image preview
* Upload validation
* Runtime request generation
* Error presentation

---

## Backend

* Gemini Vision Provider
* Prompt construction
* Response parser
* Runtime integration
* Failure handling

---

## Infrastructure

* Environment configuration
* API key management
* Request timeout handling
* Structured logging

# Gemini Provider Architecture
The production Vision Provider shall implement the existing VisionProvider abstraction.

Direct communication between the Decision Engine and Gemini is prohibited.

Gemini-specific logic shall remain encapsulated inside the GeminiVisionProvider implementation.

The provider shall:

• construct prompts
• communicate with Gemini
• validate responses
• normalize output
• return a VisionResult object

No Gemini-specific response format shall propagate beyond the provider boundary.

# API Contract

Frontend and backend communication SHALL conform to the contract defined in

API_CONTRACT.md

This includes:

- upload endpoint

- request payload

- response payload

- error responses

- HTTP status codes

Implementations shall not introduce undocumented API behaviour.
---

# Expected Runtime Flow

Citizen Upload

↓

Upload Validation

↓

GeminiVisionProvider

↓

VisionResult Schema

↓

Decision Engine

↓

Existing Evidence Orchestration

↓

Confidence Engine

↓

Municipality Report

The runtime coordinator should remain the orchestration entry point.

---

# Gemini Output Requirements

Gemini responses must be structured.

Free-form conversational responses are not acceptable.

The provider SHALL return a VisionResult object that conforms exactly to the schema defined in VISION_RESULT_SCHEMA.md.

The provider shall return:

- detected issue
- severity
- observations
- potential hazards
- infrastructure affected
- inspection priority
- reasoning summary
- limitations

The rest of the runtime should not need to understand Gemini-specific response formats.

The Confidence Engine remains solely responsible for calculating confidence scores and escalation decisions.

---

Failure handling behaviour, retry policy, timeout strategy, safety filter handling, and user-facing error responses are defined in

ERROR_HANDLING.md

The implementation shall conform to those specifications.

The runtime must never terminate unexpectedly.

Meaningful errors should be returned to the user.

---

# Logging Requirements

Structured logging should include:

* upload received
* Gemini request started
* Gemini response received
* parsing completed
* runtime execution started
* runtime completed
* execution duration
* errors

Sensitive information must never be logged.

---

# Testing Requirements

Testing requirements are defined in

TEST_PLAN.md.

Implementation shall satisfy all mandatory test cases prior to review.

## Upload

* valid image
* invalid format
* oversized image
* empty upload

---

## Gemini

* successful response
* malformed response
* timeout
* API failure

---

## Runtime

* provider integration
* decision generation
* confidence evaluation
* report generation

---

# Deliverables

Implementation is expected to produce:

* Production Vision Provider
* Upload workflow
* Gemini integration
* Runtime integration
* Validation
* Tests
* Documentation
* Evidence screenshots

---

# Evidence Required

Capture evidence demonstrating:

* Upload interface
* Successful Gemini analysis
* Runtime execution
* Decision summary
* Confidence evaluation
* Municipality report
* End-to-end workflow

---

Implementation is considered complete only when all acceptance criteria defined in

TEST_PLAN.md

and

Phase5A.md

have been satisfied.

Implementation review shall verify compliance before approval.
---

# Implementation Constraints

The following are mandatory.

DO NOT:

* redesign architecture
* modify runtime contracts
* bypass provider interfaces
* directly couple Gemini to business logic
* introduce unnecessary dependencies
* expand scope beyond Phase 5A

Implementation quality is more important than implementation speed.

Maintain the architectural discipline established throughout previous milestones.

---

# Definition of Success

Phase 5A should demonstrate that CityOps AI can replace simulated intelligence with real multimodal AI while preserving the architecture validated during Milestones 1–4.

Success is measured not by the amount of new code written, but by the seamless integration of production AI services into the existing autonomous decision pipeline without compromising modularity, maintainability, explainability, or runtime stability.
