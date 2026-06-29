# Milestone4.md (Part A)

# Milestone 4 — Evidence Collection Layer

---

# Executive Summary

Milestone 4 implements the **Evidence Collection Layer** for CityOps AI.

The AI Runtime developed in Milestone 3 is capable of reasoning, planning, confidence evaluation, and orchestration. However, it currently relies on abstract evidence providers.

Milestone 4 introduces the deterministic evidence infrastructure that transforms raw external information into structured evidence consumable by the AI Runtime.

The milestone establishes a standardized mechanism for gathering, validating, normalizing, and aggregating evidence from multiple external sources while preserving strict architectural separation between reasoning and evidence acquisition.

At the completion of this milestone, the AI Runtime will no longer reason over placeholder inputs. Instead, it will consume validated evidence from production-ready adapters while maintaining deterministic execution and complete traceability.

---

# Milestone Objective

Implement the complete **Evidence Collection Layer** required by the AI Runtime.

The milestone shall:

* establish a standardized evidence abstraction,
* implement reusable evidence contracts,
* integrate approved external evidence providers,
* normalize heterogeneous data into a unified format,
* orchestrate evidence gathering through the Tool Registry,
* expose deterministic evidence to the Decision Engine.

The milestone shall **not** introduce business logic, persistence, or user-facing workflows.

---

# Architecture Context

The following components are already complete and LOCKED.

### Milestone 1

Infrastructure

* Repository
* Docker
* CI
* Shared workspace

---

### Milestone 2

Authentication

* Firebase Authentication
* Authorization
* JWT verification
* Role management

---

### Milestone 3

AI Runtime

* Runtime Coordinator
* Decision Engine
* Tool Registry
* Confidence Engine
* AI Infrastructure

Milestone 4 extends these components without modifying them.

---

# LOCKED CONTEXT

The following architectural decisions are frozen.

They shall not be modified during Milestone 4.

---

## AI Runtime

Implemented.

Responsibilities remain unchanged.

The Runtime Coordinator continues to orchestrate execution.

---

## Decision Engine

Responsible only for reasoning.

It shall never:

* execute tools,
* communicate with Google Maps,
* process images,
* access external APIs,
* normalize evidence.

---

## Tool Registry

Responsible only for tool execution.

It shall not contain business logic.

---

## Confidence Engine

Responsible only for evaluating confidence.

It shall never collect evidence.

---

## Runtime Flow

The execution sequence remains:

```text
Citizen Request

↓

Runtime Coordinator

↓

Decision Engine

↓

Tool Registry

↓

Evidence Collection Layer

↓

Decision Engine

↓

Confidence Engine

↓

Final Recommendation
```

Milestone 4 implements only the highlighted layer.

---

## Google Cloud Stack

The existing Google Cloud architecture remains unchanged.

Milestone 4 may integrate approved services but shall not redesign deployment or infrastructure.

---

## API Contracts

All request and response contracts established in Chapter 4 remain authoritative.

Evidence providers shall comply with existing contracts whenever applicable.

---

## Firestore

Firestore remains outside the scope of this milestone.

No persistence logic shall be introduced.

---

# Requirements Traceability Matrix

| Requirement                          | Source    | Implementation          |
| ------------------------------------ | --------- | ----------------------- |
| Standardized evidence abstraction    | Chapter 5 | Evidence Framework      |
| Deterministic evidence acquisition   | Chapter 5 | Evidence Infrastructure |
| Google Maps contextual evidence      | Chapter 5 | Maps Adapter            |
| Vision-based observations            | Chapter 5 | Vision Adapter          |
| Tool execution through Tool Registry | Chapter 2 | Tool Integration        |
| Runtime compatibility                | Chapter 5 | Evidence Orchestration  |
| API contract compliance              | Chapter 4 | Shared Contracts        |
| Structured logging                   | Chapter 2 | Logging Layer           |
| Metrics collection                   | Chapter 2 | Metrics Module          |
| Error isolation                      | Chapter 5 | Adapter Error Handling  |

Every implementation requirement shall be traceable to the locked architecture.

No undocumented functionality may be introduced.

---

# Scope

Milestone 4 includes:

## Evidence Infrastructure

* Evidence models
* Evidence contracts
* Evidence interfaces
* Metadata structures
* Validation
* Logging
* Metrics

---

## External Evidence Providers

Approved providers include:

* Google Maps
* Vision analysis
* Approved municipal information sources

No additional providers shall be introduced.

---

## Evidence Processing

Implementation includes:

* normalization,
* validation,
* aggregation,
* adapter abstraction,
* deterministic formatting.

---

## Runtime Integration

Evidence shall integrate only through the existing Tool Registry and Runtime Coordinator.

No direct coupling to the Decision Engine is permitted.

---

## Testing

Milestone 4 shall include:

* unit testing,
* integration testing,
* adapter validation,
* runtime compatibility testing,
* failure scenario testing.

---

# Out of Scope

The following are explicitly excluded.

## Business Logic

* complaint classification,
* work order generation,
* department assignment,
* citizen workflows.

---

## Persistence

* Firestore collections,
* report lifecycle,
* database writes,
* storage.

---

## User Interfaces

* Citizen application,
* Authority dashboard,
* Review interface.

---

## Human Review

Confidence escalation workflows remain outside this milestone.

---

## Deployment

Cloud Run deployment, CI/CD enhancements, monitoring dashboards, and production rollout remain future milestones.

---

# Milestone Deliverables

Upon completion, Milestone 4 shall provide:

* Evidence Framework
* Evidence Contracts
* Evidence Infrastructure
* Google Maps Adapter
* Vision Adapter
* Evidence Normalization Layer
* Evidence Orchestration Layer
* Runtime Integration
* Comprehensive Tests
* Review Documentation

These deliverables collectively provide the AI Runtime with deterministic, production-ready evidence while preserving every architectural boundary established in the locked specification.

---

# Transition to Part B

The following sections are defined in **Part B**:

* Internal Implementation Phases
* Components
* Modules
* Folder Structure
* Interfaces
* Runtime Behaviour
* Google Cloud Services
* External Dependencies

These sections translate the architectural requirements above into an implementation-ready technical specification without redefining the locked architecture.


# Milestone4.md (Part B)

---

# Internal Implementation Phases

Milestone 4 is divided into three implementation phases.

Each phase represents a complete engineering deliverable.

A phase may begin only after the previous phase has been:

* implemented,
* verified,
* technically reviewed,
* approved,
* locked.

---

## Phase 1 — Evidence Infrastructure

Objective:

Create the common foundation used by every evidence provider.

Primary responsibilities:

* Evidence Framework
* Evidence Contracts
* Evidence Models
* Base Interfaces
* Validation
* Logging
* Metrics
* Shared Utilities

Expected outcome:

A reusable infrastructure capable of supporting every future evidence provider without duplication.

---

## Phase 2 — Evidence Tools

Objective:

Implement deterministic evidence providers.

Primary responsibilities:

* Google Maps Adapter
* Vision Adapter
* Municipal Tool Adapters
* Evidence Extraction
* Response Parsing
* Evidence Normalization
* Provider Validation

Expected outcome:

Every external provider produces standardized Evidence objects independent of provider implementation.

---

## Phase 3 — Evidence Orchestration

Objective:

Coordinate multiple evidence providers into a unified evidence package.

Primary responsibilities:

* Evidence Coordinator
* Provider Scheduling
* Aggregation
* Runtime Integration
* Failure Recovery
* Timeout Handling
* Evidence Packaging
* End-to-End Validation

Expected outcome:

The Runtime Coordinator can request evidence through the Tool Registry and receive deterministic evidence bundles.

---

# Component Responsibilities

Milestone 4 introduces the following architectural components.

---

## Evidence Framework

Responsibilities:

* Define Evidence abstraction
* Standardize evidence representation
* Maintain metadata
* Validate evidence
* Ensure deterministic formatting

Must NOT:

* Execute tools
* Perform reasoning
* Store reports

---

## Evidence Provider

Responsibilities:

* Query external systems
* Parse provider responses
* Convert provider data into Evidence objects

Must NOT:

* Perform reasoning
* Calculate confidence
* Call Runtime Coordinator directly

---

## Evidence Adapter

Responsibilities:

* Encapsulate provider-specific logic
* Hide external API implementation
* Normalize provider responses

Each provider shall have its own adapter.

---

## Evidence Normalizer

Responsibilities:

* Standardize data
* Remove provider-specific formatting
* Ensure schema compliance
* Validate output

---

## Evidence Coordinator

Responsibilities:

* Coordinate multiple providers
* Aggregate evidence
* Handle failures
* Respect execution order
* Return unified evidence package

The coordinator shall not contain reasoning logic.

---

# Folder Structure

Recommended backend structure:

```text
backend/src/

evidence/
│
├── contracts/
├── models/
├── interfaces/
├── framework/
├── providers/
│
│   ├── maps/
│   ├── vision/
│   └── municipal/
│
├── adapters/
├── normalization/
├── orchestration/
├── validation/
├── logging/
├── metrics/
└── tests/
```

Each folder shall contain one architectural responsibility.

Avoid mixed responsibilities.

---

# Module Responsibilities

## contracts/

Shared Evidence contracts.

---

## models/

Evidence models.

Metadata.

Provider-independent schemas.

---

## interfaces/

Provider interfaces.

Base abstractions.

Dependency inversion.

---

## framework/

Evidence creation.

Validation.

Lifecycle management.

---

## providers/

External provider implementations.

No shared business logic.

---

## adapters/

External API wrappers.

Provider translation.

---

## normalization/

Evidence normalization.

Schema conversion.

Data cleaning.

---

## orchestration/

Evidence coordination.

Aggregation.

Execution control.

---

## validation/

Evidence validation.

Consistency checks.

Required field verification.

---

## logging/

Evidence logging.

Execution traces.

Performance metrics.

---

## metrics/

Runtime metrics.

Provider latency.

Failure rates.

Evidence quality metrics.

---

# Interfaces

Every provider shall expose a common interface.

Minimum responsibilities:

* initialize
* validate request
* collect evidence
* normalize output
* return Evidence object
* report execution metadata

No provider shall expose provider-specific contracts outside its adapter.

---

# Runtime Behaviour

The execution flow shall remain deterministic.

Runtime sequence:

```text
Runtime Coordinator

↓

Decision Engine

↓

Tool Registry

↓

Evidence Coordinator

↓

Provider Selection

↓

Provider Execution

↓

Normalization

↓

Aggregation

↓

Evidence Package

↓

Decision Engine
```

The Runtime Coordinator never communicates directly with external providers.

The Tool Registry remains the only execution gateway.

---

# External Dependencies

Permitted dependencies include:

* Google Maps APIs
* Vision analysis service
* Existing Google Cloud SDKs
* Existing shared contracts

New dependencies must satisfy:

* production support,
* active maintenance,
* compatibility with the existing repository.

---

# Google Cloud Services

Milestone 4 may integrate approved Google Cloud services required for evidence acquisition.

Permitted services include:

* Google Maps Platform
* Gemini Vision capabilities (through approved AI interfaces)
* Existing authentication mechanisms
* Existing configuration management

Milestone 4 shall NOT:

* modify Cloud Run,
* modify Firebase Authentication,
* redesign deployment,
* introduce new infrastructure services.

---

# Configuration

All provider configuration shall use environment variables.

No provider shall:

* hardcode credentials,
* hardcode API keys,
* hardcode URLs.

Every provider shall fail fast if mandatory configuration is missing.

---

# Dependency Rules

Evidence components may depend on:

* Shared Contracts
* Shared Configuration
* Logging
* Metrics

Evidence components shall NOT depend on:

* Firestore
* Citizen UI
* Authority UI
* Business workflows
* Runtime internals beyond approved interfaces

---

# Runtime Constraints

The Evidence Layer shall guarantee:

* deterministic outputs
* repeatable execution
* isolated provider failures
* bounded execution time
* complete execution logging
* schema validation before returning evidence

These guarantees are mandatory because the Decision Engine assumes trusted, normalized evidence.

---

# Transition to Part C

Part C completes the milestone specification with:

* Acceptance Criteria
* Testing Matrix
* Failure Matrix
* Common Implementation Mistakes
* Definition of Done
* Engineering Brief
* Required References
* Antigravity Handoff
* Review Workflow

Part C serves as the implementation completion checklist and engineering handoff package.


# Milestone4.md (Part C)

---

# Acceptance Criteria

Milestone 4 shall be considered complete only when **all** of the following conditions are satisfied.

## Architecture

* Evidence Collection Layer fully implemented.
* All architectural boundaries preserved.
* No architectural deviations introduced.
* AI Runtime remains unchanged.

---

## Engineering

* All required modules implemented.
* No duplicated provider logic.
* Strong typing throughout the Evidence Layer.
* Dependency injection used where appropriate.
* Structured logging implemented.
* Runtime metrics collected.

---

## Runtime

The Runtime Coordinator successfully obtains evidence through the Tool Registry.

Evidence returned to the Decision Engine is:

* validated,
* normalized,
* deterministic,
* provider-independent.

---

## Providers

Every approved provider:

* initializes correctly,
* validates requests,
* handles failures,
* respects timeout limits,
* returns standardized Evidence objects.

---

## Testing

The following must pass:

* Backend build
* Frontend build
* Shared workspace build
* Unit tests
* Integration tests
* Evidence validation tests
* Runtime compatibility tests

---

# Testing Matrix

| Component            | Unit | Integration | Runtime | Failure |
| -------------------- | :--: | :---------: | :-----: | :-----: |
| Evidence Framework   |   ✓  |      ✓      |    ✓    |    ✓    |
| Evidence Contracts   |   ✓  |      ✓      |    -    |    -    |
| Evidence Models      |   ✓  |      ✓      |    -    |    -    |
| Google Maps Adapter  |   ✓  |      ✓      |    ✓    |    ✓    |
| Vision Adapter       |   ✓  |      ✓      |    ✓    |    ✓    |
| Municipal Adapters   |   ✓  |      ✓      |    ✓    |    ✓    |
| Evidence Normalizer  |   ✓  |      ✓      |    ✓    |    ✓    |
| Evidence Coordinator |   ✓  |      ✓      |    ✓    |    ✓    |
| Runtime Integration  |   -  |      ✓      |    ✓    |    ✓    |

---

# Failure Matrix

The implementation shall correctly handle the following failure scenarios.

| Failure                   | Expected Behaviour                                            |
| ------------------------- | ------------------------------------------------------------- |
| Missing API Key           | Fail fast during initialization                               |
| Invalid Request           | Return structured validation error                            |
| Provider Timeout          | Isolate provider failure and continue where permitted         |
| Provider API Failure      | Return structured provider error                              |
| Invalid Provider Response | Reject response during normalization                          |
| Missing Required Fields   | Validation failure                                            |
| Partial Evidence          | Aggregate available evidence while recording failure metadata |
| Unsupported Provider      | Reject during provider selection                              |
| Runtime Cancellation      | Gracefully terminate evidence collection                      |
| Internal Exception        | Log error and return deterministic failure response           |

No failure shall cause uncontrolled runtime termination.

---

# Common Implementation Mistakes

The following are considered architectural violations.

## Do NOT

* Execute providers directly from the Decision Engine.
* Call Google APIs outside approved adapters.
* Store evidence in Firestore.
* Perform reasoning inside providers.
* Calculate confidence inside the Evidence Layer.
* Couple provider implementations together.
* Return provider-specific objects outside adapters.
* Bypass the Tool Registry.
* Hardcode API keys.
* Ignore timeout handling.
* Skip evidence validation.
* Skip normalization.

Every provider must remain independently replaceable.

---

# Definition of Done

Milestone 4 is complete only when:

* Phase 1 approved.
* Phase 2 approved.
* Phase 3 approved.
* All review findings resolved.
* No architectural deviations remain.
* Runtime integration verified.
* All verification passes.
* Documentation updated.
* Review packages generated.

Anything less is considered incomplete.

---

# Engineering Brief for Antigravity

## Objective

Implement the complete Evidence Collection Layer required by the AI Runtime.

The milestone provides reliable, structured evidence to support deterministic reasoning.

It does **not** modify the reasoning pipeline.

---

## Responsibilities

Implement:

* Evidence Framework
* Evidence Infrastructure
* Evidence Providers
* Evidence Adapters
* Evidence Normalization
* Evidence Coordination
* Runtime Integration

Only.

---

## Preserve

Do not modify:

* Runtime Coordinator
* Decision Engine
* Confidence Engine
* Authentication
* API Architecture
* Firestore Architecture
* Google Cloud Architecture

---

## Quality Expectations

The implementation shall be:

* modular,
* deterministic,
* strongly typed,
* production ready,
* fully tested,
* easily extensible.

---

## Success Criteria

Success is measured by:

* clean builds,
* passing tests,
* deterministic runtime,
* successful runtime integration,
* successful technical review,
* zero architectural deviations.

---

# Required References

Every implementation phase shall reference the following documents.

## Mandatory

* IMPLEMENTATION_CONTEXT.md
* README.md
* Milestone4.md
* Current Phase Specification
* Chapter 2
* Chapter 4
* Chapter 5

---

## Optional

Read additional documentation only if required to resolve an implementation ambiguity.

Do not use future milestone documents.

---

# Handoff to Antigravity

Before implementation begins:

Read:

```text
IMPLEMENTATION_CONTEXT.md

↓

README.md

↓

Milestone4.md

↓

Current Phase Specification
```

Then:

1. Produce an internal implementation plan.
2. Verify the plan against the specification.
3. Implement only the current phase.
4. Run build, lint, and tests.
5. Generate the review package.
6. Stop.

Never begin the next phase without approval.

---

# Review Workflow

Each phase follows the same review lifecycle.

```text
Specification

↓

Implementation

↓

Verification

↓

IMPLEMENTATION_REVIEW_PACKAGE.md

↓

Technical Review

↓

Review Fixes

↓

Approval

↓

Phase Locked
```

Only locked phases become dependencies for subsequent phases.

---

# Milestone Completion

Milestone 4 is complete only when:

* All three phases are locked.
* Every review package has been approved.
* Final milestone review has been approved.
* PROJECT_STATUS.md has been updated.
* Repository tagged.
* Ready to begin Milestone 5 is explicitly confirmed.

---

# Deliverables

Upon completion, Milestone 4 shall produce:

```text
docs/
└── Reviews/
    └── Milestone4/
        ├── Phase1/
        │   IMPLEMENTATION_REVIEW_PACKAGE.md
        ├── Phase2/
        │   IMPLEMENTATION_REVIEW_PACKAGE.md
        ├── Phase3/
        │   IMPLEMENTATION_REVIEW_PACKAGE.md
        ├── MILESTONE4_IMPLEMENTATION_SUMMARY.md
        └── GEMINI_FINAL_REVIEW.md
```

---

# Final Statement

Milestone 4 establishes the deterministic Evidence Collection Layer that enables the AI Runtime to reason over reliable, normalized, and validated contextual information.

It intentionally excludes persistence, business workflows, user interfaces, and deployment.

Its sole purpose is to ensure that every decision produced by the AI Runtime is based on consistent, traceable, and production-ready evidence while preserving the locked architecture and maintaining complete separation of concerns.
