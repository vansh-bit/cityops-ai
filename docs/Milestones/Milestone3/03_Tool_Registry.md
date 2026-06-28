# 03_Tool_Registry.md

**Milestone:** 3

**Phase:** 3

**Status:** Ready for Engineering

---

# Part A – Tool Registry Foundation

---

# 1. Executive Summary

The Tool Registry is the controlled execution layer of the AI Decision Engine.

Its purpose is to provide a secure, deterministic, and extensible mechanism through which the Decision Engine can obtain external evidence without becoming coupled to external services.

The Tool Registry is **not** responsible for reasoning.

It is **not** responsible for confidence evaluation.

It is **not** responsible for runtime orchestration.

Instead, it acts as the execution gateway between the Decision Engine and evidence providers.

Every external capability available to the AI SHALL be exposed through the Tool Registry.

No component may bypass this layer.

---

# 2. Objective

Implement the complete Tool Registry infrastructure required by the AI runtime.

At completion, the registry shall be capable of:

* maintaining a catalog of available tools,
* validating Tool Requests,
* selecting the requested tool,
* dispatching execution,
* collecting observations,
* handling execution failures,
* returning standardized Tool Responses.

Business logic inside the tools themselves remains lightweight until Milestone 4.

---

# 3. Dependencies

## Completed Milestones

* Milestone 1
* Milestone 2

---

## Completed Phases

* 01_AI_Infrastructure
* 02_Decision_Engine

---

## Required Components

The following components must already exist:

* AI Service
* Decision Engine
* Decision State
* Tool Request Contracts
* Logging Infrastructure

---

## External Dependencies

The registry may communicate with external services through approved adapters only.

Direct communication with external services is prohibited.

---

# 4. Scope

This phase SHALL implement only the execution framework.

Included:

* Tool Registry
* Tool Interfaces
* Tool Registration
* Tool Discovery
* Tool Dispatch
* Tool Validation
* Tool Metadata
* Tool Response Contracts
* Execution Logging
* Timeout Management
* Failure Isolation

---

# 5. Out of Scope

The following SHALL NOT be implemented during this phase.

## Decision Making

Reasoning belongs exclusively to the Decision Engine.

---

## Runtime Coordination

The Runtime Coordinator belongs to Phase 5.

---

## Confidence Evaluation

Handled in Phase 4.

---

## Firestore Operations

No repositories.

No persistence.

No writes.

---

## Dashboard Logic

No authority functionality.

---

## Actual Tool Intelligence

Tool implementations should remain minimal.

This phase focuses on execution infrastructure rather than sophisticated business logic.

---

# 6. Tool Registry Responsibilities

The Tool Registry owns the complete lifecycle of tool execution.

Its responsibilities are divided into six stages.

---

## Stage 1 — Registry Initialization

Load every approved tool.

Validate:

* registration
* metadata
* identifiers
* capabilities

Duplicate registrations are prohibited.

---

## Stage 2 — Tool Discovery

Given a Tool Request,

identify the appropriate registered tool.

Selection must be deterministic.

No dynamic AI-based selection occurs here.

The Decision Engine has already selected the required tool.

---

## Stage 3 — Validation

Before execution,

validate:

* required inputs
* supported operations
* execution permissions
* request integrity

Invalid Tool Requests SHALL be rejected immediately.

---

## Stage 4 — Execution Dispatch

Dispatch the request to the selected tool.

Responsibilities:

* create execution context
* invoke tool
* monitor execution
* enforce timeout
* collect response

The registry SHALL NOT modify tool outputs.

---

## Stage 5 — Observation Standardization

Convert tool-specific outputs into standardized observations.

Every tool SHALL return observations through a common contract.

The Decision Engine must never understand individual tool formats.

---

## Stage 6 — Response Delivery

Return the standardized observation to the Runtime Coordinator.

The registry SHALL never modify Decision State.

---

# 7. Tool Registry Architecture

The Tool Registry SHALL remain independent from individual tools.

```text
Decision Engine
        │
        ▼
Tool Request
        │
        ▼
Tool Registry
        │
        ▼
Tool Dispatcher
        │
        ▼
Registered Tool
        │
        ▼
Tool Response
        │
        ▼
Observation
```

Every interaction passes through the registry.

---

# 8. Registered Tool Model

Every tool SHALL expose standardized metadata.

Required metadata includes:

* Tool Identifier
* Tool Name
* Tool Category
* Purpose
* Required Inputs
* Output Type
* Timeout
* Availability
* Version

This metadata enables deterministic execution and future extensibility.

---

# 9. Core Registry Components

The following logical components SHALL exist.

---

## Tool Registry

Responsibilities:

* Maintain tool catalog
* Register tools
* Discover tools
* Validate registrations

---

## Tool Dispatcher

Responsibilities:

* Route execution
* Invoke selected tool
* Manage execution lifecycle

---

## Tool Validator

Responsibilities:

* Validate requests
* Validate inputs
* Reject malformed requests

---

## Tool Response Mapper

Responsibilities:

* Normalize outputs
* Produce Observation objects
* Hide implementation-specific formats

---

## Execution Monitor

Responsibilities:

* Measure latency
* Detect timeout
* Capture execution metrics
* Record failures

---

# 10. Files & Modules

Recommended implementation structure.

```text
backend/
└── src/
    └── tools/
        ├── registry/
        │   ├── ToolRegistry
        │   ├── ToolDispatcher
        │   ├── ToolValidator
        │   ├── ToolResponseMapper
        │   └── ExecutionMonitor
        │
        ├── contracts/
        │
        ├── metadata/
        │
        ├── adapters/
        │
        └── common/
```

Individual tools should reside separately from registry infrastructure.

---

# 11. Design Principles

The Tool Registry SHALL follow these principles.

---

## Single Entry Point

Every tool invocation SHALL pass through the Tool Registry.

Direct execution is prohibited.

---

## Interface First

The registry communicates only through standardized tool interfaces.

Concrete implementations remain replaceable.

---

## Deterministic Dispatch

Registry behavior must never depend on AI decisions.

The Decision Engine has already determined which tool should execute.

---

## Tool Isolation

Failure of one tool SHALL NOT affect registry stability.

Each execution must remain isolated.

---

## Standardized Outputs

Every tool returns observations through a common format.

The Decision Engine must remain unaware of implementation-specific details.

---

## Extensibility

Adding future tools shall require:

* registration,
* metadata,
* interface implementation,

without modification of existing registry logic.

---

# Part A Status

**Status:** ✅ Complete

### Deliverables Completed

* Executive Summary
* Objective
* Dependencies
* Scope
* Out of Scope
* Tool Registry Responsibilities
* Registry Architecture
* Registered Tool Model
* Core Registry Components
* Files & Modules
* Design Principles

### Implementation Readiness

**READY**

This part establishes the structural foundation of the Tool Registry. It defines how tools are discovered, validated, dispatched, and normalized while maintaining strict separation from reasoning, runtime orchestration, and confidence evaluation. Tool execution behavior, lifecycle management, testing, and engineering standards will be specified in **Part B – Tool Execution & Dispatch**.

# 03_Tool_Registry.md

**Milestone:** 3

**Phase:** 3

**Status:** Ready for Engineering

---

# Part B – Tool Execution & Dispatch

---

# 12. Tool Execution Lifecycle

Every Tool Request SHALL follow a deterministic execution lifecycle.

The Tool Registry is responsible for managing this lifecycle from validation to standardized observation generation.

```text
Tool Request
      │
      ▼
Validation
      │
      ▼
Tool Discovery
      │
      ▼
Execution Context
      │
      ▼
Tool Invocation
      │
      ▼
Execution Monitoring
      │
      ▼
Response Validation
      │
      ▼
Observation Mapping
      │
      ▼
Return Observation
```

No stage may be skipped.

---

# 13. Tool Discovery

The Tool Registry SHALL identify the correct tool using the Tool Identifier supplied by the Decision Engine.

The registry SHALL NOT perform reasoning.

Its responsibility is limited to locating the requested tool.

---

## Responsibilities

Tool Discovery SHALL:

* verify the tool exists,
* verify the tool is registered,
* verify the tool is enabled,
* verify the tool supports the requested operation.

---

## Invalid Requests

Reject requests when:

* tool does not exist,
* tool is disabled,
* request is malformed,
* required metadata is missing.

Failures SHALL return structured errors.

---

# 14. Execution Context

Before invoking a tool, the Tool Registry SHALL create an Execution Context.

The Execution Context contains all runtime information required during execution.

---

## Responsibilities

Maintain:

* Tool Identifier
* Request Identifier
* Correlation Identifier
* Start Time
* Timeout
* Execution Metadata

The Execution Context SHALL be immutable after creation.

---

# 15. Tool Invocation

The registry SHALL invoke exactly one tool per Tool Request.

Parallel execution is prohibited within a single Tool Request.

---

## Responsibilities

The Tool Dispatcher SHALL:

* prepare execution,
* invoke the selected tool,
* wait for completion,
* receive raw output.

---

## Execution Rules

The registry SHALL NOT:

* modify tool inputs,
* inject reasoning,
* execute additional tools,
* retry execution automatically.

Each Tool Request corresponds to one execution.

---

# 16. Response Validation

Every tool response SHALL be validated before acceptance.

---

## Validation Checks

Verify:

* response structure,
* required fields,
* successful execution status,
* supported response type,
* metadata integrity.

Malformed responses SHALL be rejected.

---

## Validation Outcomes

Possible outcomes:

* Valid
* Invalid
* Timeout
* Failed
* Unsupported

Each outcome SHALL be logged.

---

# 17. Observation Mapping

Individual tools may return different response formats.

The Tool Registry SHALL normalize every successful response into a common Observation object.

---

## Responsibilities

The Observation Mapper SHALL:

* convert tool-specific data,
* preserve evidence,
* attach metadata,
* preserve provenance,
* record execution source.

---

## Standard Observation

Every Observation SHALL contain:

* Observation Identifier
* Tool Identifier
* Timestamp
* Observation Type
* Observation Payload
* Execution Metadata

The Decision Engine SHALL consume only Observation objects.

---

# 18. Timeout Management

Every tool execution SHALL have a bounded execution window.

The registry SHALL enforce timeouts independently of tool implementations.

---

## Timeout Behaviour

If timeout occurs:

* terminate execution,
* record timeout,
* generate failure observation,
* return structured failure.

No automatic retry is permitted.

This aligns with the bounded execution philosophy defined in Chapter 5.

---

# 19. Failure Isolation

Failure of one tool SHALL NOT compromise registry stability.

Each execution SHALL be isolated.

---

## Recoverable Failures

Examples:

* timeout
* temporary API failure
* unavailable service

Registry responsibilities:

* record failure,
* return structured result,
* allow Runtime to continue if appropriate.

---

## Non-Recoverable Failures

Examples:

* malformed Tool Request
* invalid registration
* incompatible response

Execution SHALL terminate immediately.

---

# 20. Registry Logging

Every execution SHALL generate structured logs.

---

## Log Contents

Record:

* Request ID
* Tool ID
* Start Time
* End Time
* Duration
* Status
* Failure Reason (if applicable)

Never log:

* citizen images,
* prompt contents,
* personally identifiable information.

---

# 21. Metrics Collection

The Tool Registry SHALL expose execution metrics.

Required metrics include:

* execution count,
* average latency,
* timeout count,
* failure count,
* success rate,
* per-tool usage.

These metrics support future monitoring and optimization.

---

# 22. Tool Execution Constraints

The following constraints SHALL always hold.

---

## TC-01

Exactly one tool executes per Tool Request.

---

## TC-02

The Tool Registry SHALL never invoke another tool recursively.

---

## TC-03

Tool execution SHALL be synchronous from the registry's perspective.

---

## TC-04

Execution SHALL always be traceable through a Correlation ID.

---

## TC-05

Every execution SHALL produce either:

* Observation

or

* Structured Failure

Never both.

---

## TC-06

Execution SHALL NOT mutate Decision State.

---

## TC-07

Tool implementations SHALL remain unaware of the Decision Engine.

---

## TC-08

Registry SHALL never interpret business meaning from observations.

Interpretation belongs exclusively to the Decision Engine.

---

# 23. Component Collaboration

```text
Decision Engine
      │
      ▼
Tool Request
      │
      ▼
Tool Registry
      │
      ▼
Tool Dispatcher
      │
      ▼
Registered Tool
      │
      ▼
Raw Response
      │
      ▼
Response Validator
      │
      ▼
Observation Mapper
      │
      ▼
Observation
```

Every interaction passes through the registry pipeline.

---

# 24. Exit Criteria

This phase is complete when:

* Tool Registry discovers tools correctly.
* Tool Dispatcher invokes tools deterministically.
* Execution Context is created for every request.
* Responses are validated.
* Observations are standardized.
* Timeouts are enforced.
* Failures are isolated.
* Metrics are collected.
* Structured logging is operational.

No business logic shall exist inside the registry.

---

## Part B Status

**Status:** ✅ Complete

### Deliverables Completed

* Tool Execution Lifecycle
* Tool Discovery
* Execution Context
* Tool Invocation
* Response Validation
* Observation Mapping
* Timeout Management
* Failure Isolation
* Registry Logging
* Metrics Collection
* Execution Constraints
* Component Collaboration
* Exit Criteria

### Implementation Readiness

**READY**

Part B completely specifies how the Tool Registry manages execution while remaining independent of reasoning, confidence evaluation, and runtime orchestration. The remaining engineering guidance—interfaces, testing, acceptance criteria, common implementation mistakes, and handoff instructions—will be covered in **Part C – Engineering Execution**.


# 03_Tool_Registry.md

**Milestone:** 3

**Phase:** 3

**Status:** Ready for Engineering

---

# Part C – Engineering Execution

---

# 25. Implementation Order

The Tool Registry SHALL be implemented in the following sequence.

Each step depends upon the previous one.

---

## Step 1 — Tool Contracts

Implement the common interfaces that every tool must satisfy.

Deliverables:

* Tool Interface
* Tool Request Contract
* Tool Response Contract
* Observation Contract

### Exit Criteria

Every future tool can implement the common interface without modifying registry code.

---

## Step 2 — Registry Core

Implement the registry responsible for maintaining tool metadata.

Responsibilities:

* Registration
* Discovery
* Lookup
* Validation

### Exit Criteria

The registry correctly resolves registered tools.

---

## Step 3 — Dispatcher

Implement execution routing.

Responsibilities:

* Create execution context
* Dispatch tool
* Capture response

### Exit Criteria

Dispatcher successfully routes Tool Requests.

---

## Step 4 — Validation Layer

Implement validation.

Responsibilities:

* Validate Tool Requests
* Validate Tool Responses
* Validate Metadata

### Exit Criteria

Malformed requests are rejected before execution.

---

## Step 5 — Response Mapper

Implement normalization.

Responsibilities:

* Convert responses
* Produce Observation objects
* Preserve provenance

### Exit Criteria

Every successful tool execution returns a standardized Observation.

---

## Step 6 — Monitoring

Implement execution monitoring.

Responsibilities:

* Logging
* Metrics
* Timeout handling
* Failure recording

### Exit Criteria

Every execution is observable.

---

# 26. Interfaces

The following interfaces SHALL exist before concrete implementations.

---

## Tool Interface

Purpose

Represents every executable tool.

Responsibilities

* Accept Tool Request
* Execute operation
* Return Tool Response

---

## Registry Interface

Purpose

Manage registered tools.

Responsibilities

* Register
* Unregister
* Discover
* Retrieve

---

## Dispatcher Interface

Purpose

Execute Tool Requests.

Responsibilities

* Route requests
* Create execution context
* Return execution result

---

## Validator Interface

Purpose

Validate execution.

Responsibilities

* Request validation
* Response validation
* Metadata validation

---

## Response Mapper Interface

Purpose

Normalize outputs.

Responsibilities

* Convert responses
* Produce Observation
* Preserve metadata

---

## Monitoring Interface

Purpose

Collect execution metrics.

Responsibilities

* Log execution
* Measure latency
* Track failures
* Export metrics

---

# 27. Engineering Constraints

The following constraints are mandatory.

---

## TR-01

All tool execution SHALL occur through the Tool Registry.

---

## TR-02

Registry SHALL never perform reasoning.

---

## TR-03

Registry SHALL never calculate confidence.

---

## TR-04

Registry SHALL never access Firestore.

---

## TR-05

Registry SHALL never invoke Gemini.

---

## TR-06

Registry SHALL never interpret observations.

---

## TR-07

Every registered tool SHALL expose metadata.

---

## TR-08

Every execution SHALL produce structured logging.

---

## TR-09

Every response SHALL become an Observation.

---

## TR-10

Registry SHALL remain completely stateless between executions.

Persistent execution state belongs to the Runtime Coordinator.

---

# 28. Testing Matrix

## Unit Tests

| Component         | Required Tests                              |
| ----------------- | ------------------------------------------- |
| Tool Registry     | Registration, lookup, duplicate prevention  |
| Dispatcher        | Correct routing, execution lifecycle        |
| Validator         | Valid/invalid requests, malformed responses |
| Response Mapper   | Normalization accuracy                      |
| Execution Monitor | Logging, metrics, timeout recording         |

---

## Integration Tests

Verify:

* Decision Engine → Tool Registry
* Registry → Dispatcher
* Dispatcher → Tool
* Tool → Response Mapper
* Response Mapper → Observation

---

## Manual Tests

Validate:

* Successful tool execution
* Invalid tool identifier
* Disabled tool
* Timeout handling
* Response normalization
* Structured logging
* Metrics generation

---

## Failure Scenarios

Test:

* Missing tool
* Duplicate registration
* Invalid metadata
* Malformed response
* Timeout
* Internal execution exception
* Unsupported response type

---

## Performance Checks

Verify:

* Registry lookup latency
* Dispatch latency
* Response mapping overhead
* Logging overhead
* Metric collection overhead

The registry should introduce minimal overhead beyond the actual tool execution.

---

# 29. Failure Matrix

| Failure                     | Expected Behaviour                                |
| --------------------------- | ------------------------------------------------- |
| Unknown Tool                | Reject request before dispatch                    |
| Duplicate Registration      | Reject registration                               |
| Invalid Metadata            | Prevent tool registration                         |
| Invalid Request             | Return validation failure                         |
| Tool Timeout                | Generate structured timeout failure               |
| Tool Exception              | Capture exception and return structured failure   |
| Invalid Response            | Reject response during validation                 |
| Observation Mapping Failure | Return controlled execution failure               |
| Logging Failure             | Continue execution while recording fallback error |
| Metrics Failure             | Do not interrupt tool execution                   |

Failures SHALL never corrupt the registry.

---

# 30. Common Implementation Mistakes

Avoid the following.

---

## Architecture

❌ Executing tools outside the registry.

Every execution must pass through the Tool Registry.

---

❌ Registry performing reasoning.

Reasoning belongs only to the Decision Engine.

---

❌ Registry modifying observations.

Only normalize.

Never interpret.

---

## Execution

❌ Recursive tool execution.

A tool must never invoke another tool through the registry.

---

❌ Automatic retries.

Retries are handled by higher-level orchestration if approved.

The registry executes exactly one attempt.

---

❌ Parallel dispatch.

Each Tool Request corresponds to exactly one execution.

---

## Engineering

❌ Hardcoded tool identifiers.

Use metadata.

---

❌ Tool-specific code inside registry.

Keep registry generic.

---

❌ Missing structured logs.

Every execution must be observable.

---

# 31. Definition of Done

Phase 3 is complete only when:

### Functional

* Tool Registry initializes.
* Tools register successfully.
* Dispatcher routes Tool Requests.
* Responses validate successfully.
* Observations are generated.
* Logging functions.
* Metrics are emitted.

---

### Architectural

* Registry remains independent of reasoning.
* Registry remains independent of runtime.
* Registry remains independent of Firestore.
* Registry remains independent of Gemini.
* Registry performs no business logic.

---

### Quality

* Unit tests pass.
* Integration tests pass.
* Existing milestones remain unaffected.
* Structured logging is complete.
* Metrics are available.
* No architectural deviations exist.

---

# 32. Engineering Notes

The Tool Registry is designed to make external capabilities interchangeable.

Engineers should optimize for:

* extensibility,
* maintainability,
* observability,
* deterministic execution.

Avoid embedding knowledge about specific tools into the registry.

New tools should be added by implementing the Tool Interface and registering metadata, without requiring changes to the registry core.

This principle minimizes future maintenance and preserves the Open/Closed Principle.

---

# 33. Handoff to Antigravity

## Objective

Implement the complete Tool Registry execution infrastructure.

---

## Build

Implement:

* Tool Registry
* Tool Dispatcher
* Tool Validator
* Response Mapper
* Execution Monitor
* Tool Contracts
* Registry Metadata

---

## Preserve

Do not change:

* Registry architecture
* Standardized Observation model
* Deterministic dispatch
* Single-entry execution
* Interface boundaries

---

## Do Not Implement

* Business tool intelligence
* Decision Engine changes
* Confidence Engine
* Runtime Coordinator
* Firestore integration
* Dashboard functionality

Those belong to later phases.

---

## Success Criteria

A successful implementation enables the Runtime Coordinator (Phase 5) to submit Tool Requests and receive standardized Observations without needing to understand tool implementations.

The registry must remain generic, deterministic, observable, and fully independent of AI reasoning.

---

# Phase 3 Status

**Status:** ✅ Ready for Engineering

**Estimated Effort:** Medium

**Risk Level:** Medium

**Primary Dependencies:**

* Phase 1 – AI Infrastructure
* Phase 2 – Decision Engine

**Exit Condition:**

The Tool Registry functions as the single execution gateway for all external evidence gathering, providing deterministic dispatch, standardized observations, structured logging, and complete execution isolation.

---

## Next Phase

**`04_Confidence_Engine.md`**

This phase implements the confidence evaluation subsystem that consumes the Decision Engine's output and determines recommendation confidence, escalation requirements, and Human Review eligibility while remaining independent of reasoning and runtime execution.
