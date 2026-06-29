# IMPLEMENTATION_CONTEXT.md

# Milestone 4 — Evidence Collection Layer

---

# Purpose

This document defines the implementation context for **Milestone 4 – Evidence Collection Layer**.

It establishes the architectural boundaries, implementation philosophy, document hierarchy, and engineering workflow for the milestone.

This document is **NOT** an implementation specification.

It exists to ensure every engineer implementing Milestone 4 understands:

* why the milestone exists,
* what problems it solves,
* how it fits into the overall system,
* which architectural decisions are already locked,
* which documents govern implementation.

Implementation details are defined in the remaining milestone documents.

---

# Milestone Objective

Milestone 3 successfully delivered the complete AI Runtime:

* AI Infrastructure
* Decision Engine
* Tool Registry
* Confidence Engine
* Runtime Coordinator

The runtime is now capable of reasoning.

However, reasoning is only as good as the evidence available.

Milestone 4 implements the **Evidence Collection Layer**, which provides the AI Runtime with deterministic, validated, structured evidence from multiple sources.

The objective is **not** to make decisions.

The objective is to provide reliable evidence that enables better decisions.

---

# Role in the System

Within the overall architecture:

```text
Citizen Report

↓

AI Runtime

↓

Evidence Collection Layer

↓

Decision Engine

↓

Confidence Engine

↓

Operational Recommendation
```

The Evidence Collection Layer is responsible for gathering contextual information required by the Decision Engine.

It does **not** perform reasoning.

It does **not** determine confidence.

It does **not** produce work orders.

---

# Architectural Status

The project architecture is **LOCKED**.

Milestone 4 must preserve:

* AI Runtime boundaries
* Tool Registry interfaces
* Runtime Coordinator responsibilities
* Decision Engine responsibilities
* Confidence Engine responsibilities
* API contracts
* Firestore architecture
* Google Cloud architecture

No architectural redesign is permitted.

If implementation reveals a genuine blocker:

1. Stop implementation.
2. Document the blocker.
3. Explain why implementation is impossible.
4. Wait for architectural approval.

---

# Engineering Philosophy

Implementation should prioritize:

1. Reliability
2. Deterministic behaviour
3. Modularity
4. Maintainability
5. Production readiness

Avoid:

* feature creep,
* premature optimization,
* unnecessary abstractions,
* duplicated logic.

Every component should have one clear responsibility.

---

# Milestone Scope

Milestone 4 implements the Evidence Collection Layer.

The milestone focuses on:

* Evidence abstraction
* Evidence models
* Evidence contracts
* External evidence adapters
* Google Maps integration
* Vision analysis integration
* Evidence normalization
* Evidence orchestration

Nothing beyond this scope should be implemented.

---

# Explicitly Out of Scope

The following remain outside Milestone 4:

* Citizen workflows
* Authority dashboard
* Firestore persistence
* Report lifecycle
* Human review workflow
* Deployment
* UI implementation
* Business process automation

These belong to later milestones.

---

# Implementation Strategy

Milestone 4 is divided into three sequential phases.

Each phase is:

* independently implementable,
* independently testable,
* independently reviewable,
* independently lockable.

No phase may begin until the previous phase has been reviewed and approved.

---

## Phase 1

Evidence Infrastructure

Focus:

* Evidence framework
* Evidence contracts
* Evidence models
* Base interfaces
* Logging
* Metrics

---

## Phase 2

Evidence Tools

Focus:

* Google Maps
* Vision services
* Tool adapters
* Evidence extraction
* Evidence normalization

---

## Phase 3

Evidence Orchestration

Focus:

* Tool coordination
* Runtime integration
* Error handling
* Aggregation
* End-to-end validation

---

# Document Hierarchy

The implementation documents must be read in the following order.

1.

IMPLEMENTATION_CONTEXT.md

↓

2.

README.md

↓

3.

Milestone4.md

↓

4.

Phase document currently being implemented

Do not skip documents.

Do not read future phase specifications unless explicitly instructed.

---

# Dependencies

Milestone 4 depends on:

* Milestone 1
* Milestone 2
* Milestone 3

These milestones are considered frozen.

Their implementation should not be modified.

---

# Engineering Workflow

For every phase:

Read specification

↓

Identify required modules

↓

Implement only the current phase

↓

Verify:

* Build
* Lint
* Tests

↓

Generate IMPLEMENTATION_REVIEW_PACKAGE.md

↓

Technical Review

↓

Apply approved fixes

↓

Lock phase

↓

Proceed to next phase

---

# Review Workflow

Every phase follows the same review process.

Engineering Implementation

↓

Implementation Review Package

↓

Technical Review

↓

Review Fixes

↓

Approval

↓

Lock

Only approved phases become implementation dependencies.

---

# Success Criteria

Milestone 4 is considered complete only when:

* all three phases are approved,
* all verification passes,
* all review findings are resolved,
* no architectural deviations exist,
* Evidence Collection Layer integrates successfully with the AI Runtime.

---

# References

Implementation documents:

* README.md
* Milestone4.md
* 01_Evidence_Infrastructure.md
* 02_Evidence_Tools.md
* 03_Evidence_Orchestration.md

Architecture documents:

* Chapter 2
* Chapter 4
* Chapter 5

These documents collectively define the complete implementation requirements.

---

# Stop Condition

This document establishes context only.

It does not authorize implementation.

Implementation begins only after the relevant phase specification has been read.

No engineer should make architectural decisions using this document alone.
