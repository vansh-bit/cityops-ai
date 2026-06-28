PROJECT_SPEC.md
Chapter 2 — System Architecture & Component Design (Part A)
Status: Implementation Specification
Architecture Status: Locked
Objective: Define the overall system architecture and establish clear boundaries between frontend, backend, AI, and Google Cloud services.

2.1 Overall System Architecture
CityOps AI follows a layered architecture that separates presentation, application logic, AI reasoning, infrastructure services, and persistence.
The system is composed of four major layers:
Frontend Layer
Backend Application Layer
AI & Tool Layer
Google Cloud Infrastructure Layer
This separation minimizes coupling, improves maintainability, and allows each layer to evolve independently without affecting others.

2.1.1 End-to-End System Architecture
                   ┌──────────────────────────────┐
                    │        Frontend Layer        │
                    │                              │
                    │  Citizen Web Application     │
                    │  Authority Dashboard         │
                    └──────────────┬───────────────┘
                                   │
                            HTTPS / REST API
                                   │
                    ┌──────────────▼───────────────┐
                    │      Backend (Cloud Run)     │
                    │                              │
                    │ API Controllers              │
                    │ AI Orchestrator              │
                    │ Ticket Service              │
                    │ Tool Services               │
                    └──────┬──────────────┬────────┘
                           │              │
             AI Services   │              │   Google Services
                           │              │
         ┌─────────────────▼───┐    ┌─────▼─────────────────┐
         │     Gemini APIs      │    │    Google Platform    │
         │                      │    │                       │
         │ Vision               │    │ Firestore            │
         │ Function Calling     │    │ Cloud Storage        │
         │ Multimodal Embedding │    │ Maps Platform        │
         └──────────────────────┘    └──────────────────────┘


2.1.2 Major System Components
Frontend
Citizen Application
Authority Dashboard
Backend
REST API
Authentication Middleware
Ticket Service
AI Orchestrator
Tool Registry
Storage Service
AI Components
Gemini Vision
AI Orchestrator
Function Calling
Multimodal Embeddings
Infrastructure
Cloud Run
Firestore
Cloud Storage
Maps Platform

2.1.3 High-Level Data Flow
Citizen uploads image and GPS location.
Image is stored in Cloud Storage.
Backend invokes Gemini Vision.
AI Orchestrator begins evidence-driven reasoning.
Required tools are invoked dynamically.
AI generates municipality-ready work order.
Citizen confirms submission.
Ticket is stored in Firestore.
Authority Dashboard receives updated ticket.

2.2 Frontend Architecture
The frontend consists of two independent applications sharing the same backend API.
Frontend
│
├── Citizen Application
│
└── Authority Dashboard

Each application has independent UI concerns while sharing authentication, API contracts, and data models.

2.2.1 Citizen Application
The Citizen Application provides a simple reporting workflow.
Responsibilities:
User authentication
Image upload
GPS acquisition
AI reasoning visualization
Resolution Summary display
Citizen confirmation
Ticket status viewing
The application intentionally minimizes manual user input.

Citizen Component Hierarchy
Citizen App

App

├── Login

├── Upload Screen

│     ├── Camera

│     ├── Image Preview

│     └── GPS Capture

├── AI Processing Screen

│     ├── Reasoning Timeline

│     ├── Loading States

│     └── Resolution Summary

├── Confirmation Screen

└── Ticket Status Screen


2.2.2 Authority Dashboard
The Authority Dashboard is optimized for municipal operators.
Responsibilities:
View incoming tickets
Review AI recommendations
Review low-confidence reports
Update ticket lifecycle
Monitor active infrastructure issues

Dashboard Component Hierarchy
Authority Dashboard

App

├── Authentication

├── Dashboard

│     ├── Active Issues

│     ├── Human Review Queue

│     ├── Completed Issues

│     └── Merged Reports

├── Issue Details

│     ├── Uploaded Image

│     ├── Resolution Summary

│     ├── AI Reasoning

│     └── Status Controls


2.2.3 Frontend State Management
State is divided into two categories.
UI State
Examples:
Loading indicators
Selected issue
Active page
Dialog visibility
UI state remains local to components.

Application State
Shared application state includes:
Current authenticated user
Uploaded ticket
Authority dashboard tickets
Current ticket status
Resolution Summary
Application state is synchronized with backend APIs.
The frontend is treated as a presentation layer and contains no business logic.

2.2.4 Frontend Responsibilities
The frontend SHALL:
Capture user interactions.
Display AI progress.
Render backend responses.
Validate basic user input.
Never perform AI reasoning.
Never implement business rules.
All operational logic remains in the backend.

2.3 Backend Architecture
The backend follows a layered service architecture.
Cloud Run Backend

App

├── API Layer

├── Controller Layer

├── Service Layer

├── AI Layer

├── Tool Layer

├── Repository Layer

└── Infrastructure Layer


2.3.1 API Layer
Responsibilities:
Receive requests
Authentication
Request validation
Response formatting
Contains no business logic.

2.3.2 Controller Layer
Responsibilities:
Coordinate requests
Invoke services
Return standardized responses
Controllers remain stateless.

2.3.3 Service Layer
Business logic resides here.
Major services:
Ticket Service
User Service
Upload Service
Dashboard Service
Responsibilities:
Coordinate workflows
Call AI Orchestrator
Persist tickets
Apply lifecycle rules

2.3.4 AI Layer
Contains the AI Orchestrator.
Responsibilities:
Execute evidence-driven reasoning
Manage tool execution
Generate operational recommendations
Produce Resolution Summary
No persistence occurs within the AI layer.

2.3.5 Tool Layer
The Tool Layer exposes deterministic services to the AI Orchestrator.
Responsibilities:
Nearby report lookup
Road metadata retrieval
Duplicate candidate retrieval
Department SLA retrieval
The Tool Layer never makes operational decisions.
It only retrieves validated information.

2.3.6 Repository Layer
Responsible for persistence.
Responsibilities:
Firestore reads
Firestore writes
Query optimization
Data mapping
Business logic is explicitly prohibited within repositories.

2.3.7 Storage Layer
Responsible for uploaded images.
Uses:
Cloud Storage
Responsibilities:
Store images
Generate secure URLs
Maintain upload integrity

2.4 Google Cloud Architecture
CityOps AI uses Google Cloud services according to clearly defined responsibilities.
No service is included solely for demonstration purposes.

Cloud Run
Purpose:
Backend hosting.
Responsibilities:
API hosting
AI orchestration
Business services
Tool execution
Cloud Run acts as the central execution environment.

Firestore
Purpose:
Primary operational database.
Stores:
Tickets
Users
Report history
Dashboard state
Ticket lifecycle
Firestore acts as the single source of truth.

Cloud Storage
Purpose:
Persistent image storage.
Responsibilities:
Uploaded photos
Image retrieval
AI image input

Gemini
Gemini provides:
Gemini Vision
Visual understanding.
Function Calling
Dynamic tool selection.
Multimodal Embeddings
Duplicate similarity comparison.
Gemini never directly writes to Firestore.

Google Maps Platform
Responsibilities:
Road context
Geographic visualization
Authority dashboard map
Maps provide contextual information rather than business logic.

Google Cloud Interaction
Citizen Upload

↓

Cloud Storage

↓

Cloud Run

↓

Gemini Vision

↓

AI Orchestrator

↓

Tool Services

↓

Firestore

↓

Dashboard


2.5 High-Level Data Flow
Citizen

↓

Upload Image + GPS

↓

Frontend Validation

↓

Backend API

↓

Store Image

↓

Gemini Vision

↓

AI Orchestrator

↓

Dynamic Tool Calls

↓

Operational Recommendation

↓

Citizen Confirmation

↓

Persist Ticket

↓

Authority Dashboard

Every request follows the same lifecycle.
Only the evidence gathered by the AI Orchestrator varies.

2.6 Engineering Rationale
The architecture intentionally separates responsibilities across independent layers.
Separation of Concerns
Frontend handles presentation.
Backend handles business logic.
AI handles reasoning.
Tools handle deterministic retrieval.
Infrastructure handles persistence and hosting.

Explainability
The AI never produces unexplained operational decisions.
Every recommendation is backed by retrieved evidence and exposed through the Resolution Summary and reasoning timeline.

Maintainability
Each component has a single responsibility.
Changes to AI prompts, frontend UI, storage, or Google Cloud infrastructure can be made independently without affecting unrelated components.

Scalability
The architecture supports independent scaling of:
Backend services
AI requests
Database
Storage
No component depends on direct coupling with another layer.

Reliability
Failures in supporting services (Maps, embeddings, metadata retrieval) degrade confidence rather than terminating execution.
The system always attempts to produce the safest possible recommendation.

Part A Status
Complete
This section defines the structural architecture of CityOps AI.
Subsequent sections will define:
AI Decision Engine internals
Tool Registry
Component responsibilities
Sequence diagrams
State machine
Security model
Non-functional requirements
—--------------------------------






PROJECT_SPEC.md
Chapter 2 — System Architecture & Component Design (Part B)
AI Orchestrator & Component Responsibilities
Status: Implementation Specification
Architecture Status: Locked
Objective: Define the internal architecture of the AI Orchestrator, its evidence-driven reasoning model, the deterministic tool ecosystem, and the responsibilities of every AI-related component.

2.7 AI Orchestrator Architecture
The AI Orchestrator is the central reasoning component of CityOps AI.
It is responsible for transforming an initial visual understanding into a municipality-ready operational recommendation through iterative evidence gathering.
Unlike a fixed processing pipeline, the Orchestrator dynamically determines whether additional evidence is required before making an operational decision.
The Orchestrator never directly accesses infrastructure services. Instead, it interacts exclusively through a controlled Tool Registry.

Responsibilities
The AI Orchestrator SHALL:
Interpret the initial visual analysis.
Evaluate current confidence.
Decide whether additional evidence is required.
Select the next tool to invoke.
Integrate newly acquired evidence.
Determine when sufficient evidence has been collected.
Generate the final operational recommendation.
Produce the Resolution Summary.
Assign an overall confidence score.
Recommend human review when confidence remains insufficient.
The Orchestrator SHALL NOT:
Access Firestore directly.
Read Cloud Storage directly.
Perform database queries.
Execute business rules outside AI reasoning.
Persist data.

2.8 Internal Orchestrator Flow
The Orchestrator operates as a bounded evidence-gathering loop.
Perception Output
        │
        ▼
Initial Reasoning
        │
        ▼
Need Additional Evidence?
        │
   ┌────┴────┐
   │         │
  YES       NO
   │         │
Select Tool │
   │         │
Execute Tool│
   │         │
Observe Result
   │
Reason Again
   │
Stopping Condition?
   │
 ┌─┴─────────────┐
 │               │
Continue      Generate Decision

Each iteration increases the evidence available to the Orchestrator.
The Orchestrator is bounded to a maximum of three tool invocations.

2.9 Evidence-Driven Decision Loop
The reasoning model follows the Observe–Reason–Act pattern.
Step 1 — Observe
Receive:
Perception output
Current evidence
Tool responses

Step 2 — Reason
Evaluate:
Current confidence
Missing information
Operational uncertainty
Determine whether additional evidence is required.

Step 3 — Act
Either:
Invoke exactly one tool
or
Produce the final operational recommendation.

Step 4 — Repeat
The process repeats until a stopping condition is satisfied.
The loop is deterministic in execution but adaptive in tool selection.

2.10 Tool Registry
The Tool Registry exposes deterministic capabilities to the AI Orchestrator.
Every tool has a single responsibility.
The Orchestrator may invoke only registered tools.
No direct infrastructure access is permitted.

Registered Tools
Nearby Report Tool
Purpose
Retrieve nearby unresolved reports.
Provides
nearby ticket count
distance
status
candidate identifiers

Road Context Tool
Purpose
Retrieve contextual road information.
Provides
road classification
traffic importance
municipal context

Duplicate Candidate Tool
Purpose
Identify potential duplicate reports.
Uses deterministic similarity mechanisms outside the AI.
Provides
similarity score
candidate tickets
duplicate confidence
This tool does not merge tickets.

Department SLA Tool
Purpose
Retrieve operational response guidelines.
Provides
department
target response time
operational priority guidance

2.11 Tool Selection Strategy
The Orchestrator never invokes every tool automatically.
Each invocation is an independent reasoning decision.
Selection depends on:
current confidence
evidence already collected
issue category
operational uncertainty
Example
A clearly visible garbage accumulation report may require no road context.
A pothole on a major road may require:
Nearby Reports
Road Context
Duplicate Candidate
before sufficient confidence exists.
This adaptive strategy improves explainability while minimizing unnecessary latency.

2.12 Tool Responsibilities
Tool
Responsibility
Makes Decisions
Nearby Report
Retrieve nearby reports
No
Road Context
Retrieve road metadata
No
Duplicate Candidate
Retrieve validated duplicate candidates
No
Department SLA
Retrieve operational guidelines
No

All tools are deterministic.
Operational reasoning remains exclusively the responsibility of the AI Orchestrator.

2.13 Component Responsibilities
Perception Module
Responsible for understanding the uploaded image.
Outputs:
issue type
initial severity
confidence
visual reasoning
No operational reasoning occurs here.

AI Orchestrator
Responsible for:
reasoning
evidence gathering
tool selection
confidence evaluation
operational recommendation

Tool Registry
Responsible for:
exposing deterministic services
validating tool requests
isolating infrastructure access

Resolution Generator
Responsible for converting the final operational reasoning into a structured Resolution Summary suitable for both citizens and municipal authorities.

2.14 Confidence Flow
Confidence evolves throughout the evidence-gathering process.
Initial Vision Confidence
        │
        ▼
Evidence Collected
        │
        ▼
Confidence Updated
        │
        ▼
Enough Confidence?
   │
 ┌─┴────────────┐
 │              │
YES            NO
 │              │
Generate     Human Review
Decision

Confidence is recalculated after each successful evidence retrieval.
Confidence never increases without additional evidence.

2.15 Human Review Escalation
Human review is the safety mechanism of the system.
The Orchestrator recommends escalation when:
overall confidence remains below the configured threshold,
required evidence cannot be obtained,
unsupported issue categories are detected,
conflicting evidence cannot be resolved.
Human Review SHALL:
preserve the generated Resolution Summary,
preserve collected evidence,
mark the ticket as needs_human_review,
forward the ticket to the Authority Dashboard review queue.
The AI never blocks ticket creation.

2.16 AI Component Interaction
Citizen Upload
        │
        ▼
Perception Module
        │
        ▼
AI Orchestrator
        │
        ▼
Need More Evidence?
        │
        ▼
Tool Registry
        │
        ▼
Nearby Report Tool
Road Context Tool
Duplicate Candidate Tool
Department SLA Tool
        │
        ▼
Evidence Returned
        │
        ▼
AI Orchestrator
        │
        ▼
Resolution Generator
        │
        ▼
Final Operational Recommendation

Every interaction passes through the Orchestrator.
Individual tools never communicate with each other.

2.17 Engineering Rationale
The AI architecture follows four principles.
Separation of Responsibilities
Perception, reasoning, retrieval, and persistence remain independent.
This minimizes coupling and simplifies testing.

Deterministic Retrieval
Infrastructure data is retrieved by deterministic services.
The AI reasons over evidence but never fabricates operational context.

Adaptive Reasoning
The Orchestrator gathers only the evidence required for the current report.
This reduces unnecessary API calls and improves responsiveness.

Bounded Autonomy
Autonomous behavior is intentionally constrained.
The Orchestrator:
operates within a maximum tool budget,
uses only registered tools,
cannot bypass deterministic services,
cannot persist data directly.
These constraints improve reliability, explainability, and predictability while preserving meaningful agentic behavior.

Part B Status
Complete
This section defines the complete internal AI architecture of CityOps AI.
Subsequent sections will define:
Sequence diagrams
System state machine
Security boundaries
Non-functional requirements
Engineering constraints














PROJECT_SPEC.md
Chapter 2 — System Architecture & Component Design
Part C1 — Runtime Behaviour & System Flow
Status: Implementation Specification
Architecture Status: Locked
Objective: Define the runtime behaviour of CityOps AI from the moment a citizen submits an issue until the ticket appears on the municipal dashboard.
This chapter specifies execution order, runtime guarantees, component communication, and event propagation.

2.18 Runtime Execution Contract
Every report processed by CityOps AI SHALL follow the same execution contract.
The objective is to guarantee predictable runtime behaviour regardless of issue type.

Execution Guarantees
For every citizen upload:
One visual perception pass SHALL always execute.
The AI Orchestrator SHALL begin with the perception output.
Tool invocation SHALL occur only through the Tool Registry.
Only one tool may execute during each reasoning iteration.
Maximum tool invocations: 3
Maximum orchestration iterations: 4
Initial reasoning
Up to three evidence iterations
Execution SHALL terminate with exactly one final state.
Possible terminal states:
Verified
Needs Human Review
Processing Failed
No execution may continue indefinitely.

Runtime Rules
The Orchestrator SHALL:
maintain the current evidence context,
reason after every tool response,
decide whether another tool is required,
stop immediately once sufficient evidence exists.
Tool execution order is dynamic.
The backend SHALL NOT invoke every tool automatically.

Runtime Constraints
The execution contract guarantees:
bounded latency,
bounded API consumption,
deterministic termination,
explainable reasoning.

2.19 Complete Runtime Sequence
Citizen
    │
    │ Upload Image + GPS
    ▼
Frontend
    │
    │ POST /report
    ▼
Backend API
    │
    │ Store Image
    ▼
Cloud Storage
    │
    ▼
Gemini Vision
    │
    │ Visual Understanding
    ▼
AI Orchestrator
    │
    │ Initial Reasoning
    ▼
Need More Evidence?
    │
 ┌──┴───────────────┐
 │                  │
YES                NO
 │                  │
 ▼                  │
Tool Registry       │
 │                  │
 ▼                  │
Selected Tool       │
 │                  │
 ▼                  │
Evidence Returned   │
 │                  │
 ▼                  │
AI Orchestrator ◄───┘
 │
 │ Final Operational Recommendation
 ▼
Resolution Summary
 │
 ▼
Citizen Confirmation
 │
 ▼
Firestore
 │
 ▼
Authority Dashboard


2.20 Runtime Communication Model
CityOps AI follows a request–response architecture.
Components communicate only with adjacent layers.
No component may bypass its designated boundary.
Frontend

↓

Backend API

↓

AI Orchestrator

↓

Tool Registry

↓

Infrastructure Services

This restriction ensures:
low coupling,
predictable execution,
easier testing,
simplified maintenance.

Communication Rules
Frontend
May communicate only with Backend APIs.

Backend API
Coordinates requests.
May communicate with:
AI Orchestrator
Storage
Persistence

AI Orchestrator
May communicate only through the Tool Registry.
It SHALL NOT directly query:
Firestore
Maps
Cloud Storage

Tool Registry
Acts as the infrastructure gateway.
Every infrastructure request passes through a registered tool.

Infrastructure
Returns deterministic data.
Infrastructure never initiates communication.

2.21 Event Flow
Every report generates a deterministic sequence of runtime events.
Citizen Upload

↓

Image Stored

↓

Vision Completed

↓

Reasoning Started

↓

Evidence Requested

↓

Evidence Received

↓

Reasoning Updated

↓

Operational Recommendation Generated

↓

Citizen Confirmed

↓

Ticket Persisted

↓

Dashboard Updated

These events form the runtime lifecycle of every request.
Only the evidence-gathering phase varies.

Event Responsibilities
Event
Producer
Consumer
Image Uploaded
Frontend
Backend
Image Stored
Storage Service
AI Orchestrator
Vision Completed
Gemini Vision
AI Orchestrator
Tool Requested
AI Orchestrator
Tool Registry
Tool Completed
Tool Registry
AI Orchestrator
Recommendation Generated
AI Orchestrator
Backend
Ticket Persisted
Backend
Firestore
Dashboard Updated
Firestore
Authority Dashboard

Every event has exactly one producer.
Consumers may vary.

2.22 Citizen Upload Runtime
The citizen upload lifecycle is intentionally linear.
Upload

↓

Validation

↓

Image Upload

↓

AI Processing

↓

Resolution Summary

↓

Citizen Confirmation

↓

Ticket Created

The citizen never observes:
database operations,
tool execution,
infrastructure failures.
Only AI progress and final recommendations are exposed.

2.23 Authority Runtime
Authority workflow begins only after citizen confirmation.
Ticket Created

↓

Dashboard Receives Update

↓

Status

Verified
OR
Needs Human Review

↓

Authority Opens Ticket

↓

Review

↓

Lifecycle Management

Authority interactions never invoke the AI Orchestrator again.
The AI participates only during initial triage.

2.24 Runtime Visibility
The frontend SHALL expose AI progress through a reasoning timeline.
Example:
✓ Image analyzed

↓

✓ Issue identified

↓

✓ Gathering nearby reports

↓

✓ Checking road context

↓

✓ Evaluating duplicate candidates

↓

✓ Operational recommendation generated

This timeline reflects runtime events.
It SHALL NOT expose internal implementation details.

2.25 Runtime Logging Requirements
The backend SHALL log:
request identifier,
orchestration iterations,
tools invoked,
execution duration,
terminal state.
Logs SHALL NOT contain:
citizen images,
personally identifiable information,
authentication credentials.
Runtime logs are intended for debugging and demonstration support only.

Part C1 Status
Complete
This section defines the runtime execution model, execution guarantees, sequence flow, component communication, event propagation, and runtime visibility.
The next section (Part C2) will define:
System State Machine
Failure Flow
Timeout Behaviour
Graceful Degradation
Retry Strategy
Error Propagation
# PROJECT_SPEC.md

# Chapter 2 — System Architecture & Component Design

## Part C2 — Runtime Reliability & Failure Behaviour

**Status:** Implementation Specification

**Architecture Status:** Locked

**Objective:** Define how CityOps AI behaves during failures, timeouts, retries, confidence degradation, and runtime state transitions.

This chapter ensures that every runtime execution terminates predictably while preserving system reliability and responsible AI behaviour.

---

# 2.26 System State Machine

Every report progresses through a deterministic lifecycle.

The AI cannot arbitrarily create new states.

```
Citizen Upload
       │
       ▼
Image Stored
       │
       ▼
Vision Complete
       │
       ▼
AI Processing
       │
       ▼
Evidence Gathering
       │
       ▼
Operational Decision
       │
       ▼
Confidence Evaluation
       │
 ┌─────┴─────────────┐
 │                   │
 ▼                   ▼
Verified     Needs Human Review
 │                   │
 └──────────┬────────┘
            ▼
Citizen Confirmation
            ▼
Ticket Persisted
            ▼
Authority Dashboard
            ▼
Authority Review
            ▼
Verified
            ▼
In Progress
            ▼
Completed
```

---

## State Definitions

### Image Stored

Image has been successfully uploaded to Cloud Storage.

No AI reasoning has begun.

---

### Vision Complete

Gemini Vision has successfully generated the initial perception.

Outputs:

- issue type
- severity estimate
- visual reasoning
- initial confidence

---

### AI Processing

The AI Orchestrator is actively reasoning.

Tool selection may occur.

---

### Evidence Gathering

The Orchestrator is collecting deterministic evidence.

Examples:

- Nearby reports
- Road context
- Duplicate candidates
- Department SLA

---

### Operational Decision

The Orchestrator has completed reasoning.

The final Resolution Summary has been generated.

---

### Confidence Evaluation

The final confidence score is evaluated.

This determines whether automation is permitted.

---

### Verified

Confidence exceeds the configured threshold.

The recommendation is considered operationally reliable.

---

### Needs Human Review

Confidence remains below threshold.

The recommendation is preserved but flagged for manual verification.

---

### In Progress

Municipal authority has accepted the ticket.

Operational work has begun.

---

### Completed

Issue has been resolved.

Ticket lifecycle terminates.

---

# 2.27 Failure Flow

Failures must never terminate the citizen workflow unexpectedly.

The system shall degrade safely.

```
Failure Detected
        │
        ▼
Recoverable?
        │
 ┌──────┴───────┐
 │              │
YES            NO
 │              │
Retry       Reduce Confidence
 │              │
 │         Human Review
 │              │
 └──────┬───────┘
        ▼
Continue Execution
```

The citizen always receives a result.

The system never exposes internal infrastructure failures.

---

# 2.28 Timeout Behaviour

Every runtime component has bounded execution.

Timeouts prevent infinite waiting and ensure predictable latency.

---

## AI Orchestrator

If overall orchestration exceeds the configured execution timeout:

- stop requesting additional tools
- generate the safest possible recommendation
- reduce confidence
- evaluate for Human Review

---

## Tool Invocation

Each tool invocation has an independent timeout.

If a tool exceeds its timeout:

- cancel the request
- record the failure
- continue without that evidence

---

## Gemini Vision

If perception fails:

Execution terminates.

Result:

```
Processing Failed
```

The citizen is asked to retry the submission.

No ticket is created.

---

## Firestore

If persistence fails:

Retry once.

If still unsuccessful:

Return a temporary failure message.

The citizen is asked to resubmit.

---

# 2.29 Graceful Degradation

The system is designed to continue operating whenever possible.

Loss of supporting evidence reduces confidence rather than terminating execution.

---

## Example

Road Context unavailable

↓

Continue reasoning

↓

Reduce confidence

↓

Possibly route to Human Review

---

## Component Behaviour

| Component | Failure Behaviour |
|------------|-------------------|
| Maps | Continue without road context |
| Nearby Reports | Continue without duplicate evidence |
| SLA Tool | Use default routing guidance |
| Duplicate Tool | Disable merge recommendation |
| Gemini Vision | Stop execution |
| Firestore | Retry persistence |

Graceful degradation preserves user experience while maintaining responsible AI behaviour.

---

# 2.30 Retry Strategy

Retries are conservative.

Repeated retries increase latency and API consumption.

---

## Infrastructure Services

Retry exactly once.

Applicable to:

- Firestore
- Maps
- Storage

---

## AI Services

Gemini requests SHALL NOT be retried automatically.

Reason:

Repeated AI inference may produce different outputs and increase latency.

Instead:

- preserve current result
- reduce confidence
- continue

---

## Tool Calls

Failed tool invocations are not repeated indefinitely.

Maximum:

One retry.

---

# 2.31 Error Propagation

Errors propagate upward through controlled layers.

```
Infrastructure

↓

Tool Registry

↓

AI Orchestrator

↓

Backend Service

↓

API

↓

Frontend
```

Each layer converts low-level failures into higher-level operational outcomes.

Example:

Maps timeout

↓

Road Context unavailable

↓

Confidence reduced

↓

Needs Human Review

↓

Citizen informed

No internal exception is exposed.

---

# 2.32 Processing Failed State

Processing Failed is reserved for unrecoverable failures.

Examples:

- corrupted upload
- unsupported image format
- Gemini Vision unavailable
- invalid request

Processing Failed SHALL:

- terminate execution
- prevent ticket creation
- return a user-friendly retry message

This state is intentionally rare.

---

# 2.33 Human Review Behaviour

Low-confidence recommendations are never discarded.

Instead:

```
Low Confidence

↓

Resolution Summary Generated

↓

Citizen Confirmation

↓

Ticket Created

↓

Firestore

↓

Human Review Queue

↓

Authority Verification
```

This guarantees:

- audit trail
- transparency
- explainability
- complete ticket lifecycle

---

# 2.34 Runtime Reliability Principles

The runtime architecture follows six principles.

## 1. Bounded Execution

Every request terminates.

Infinite execution is impossible.

---

## 2. Safe Failure

Failures reduce confidence rather than producing incorrect certainty.

---

## 3. Human Oversight

Low-confidence recommendations always require human verification.

---

## 4. Transparent Behaviour

The AI exposes reasoning rather than hiding uncertainty.

---

## 5. Infrastructure Independence

Failure of supporting services should not collapse the system.

---

## 6. Deterministic Lifecycle

Every ticket follows the same lifecycle regardless of issue type.

---

# Part C2 Status

Complete.

The runtime behaviour of CityOps AI is now fully specified.

The engineering team can implement:

- runtime lifecycle
- failure handling
- timeout logic
- retry policy
- confidence degradation
- human review routing

without introducing undefined behaviour.

Chapter 2 is now complete.

The next chapter is:

**Chapter 3 — Database Design & Data Model**









PROJECT_SPEC.md
Chapter 2 — System Architecture & Component Design
Part D — Security Boundaries & Reliability
Status: Implementation Specification
Architecture Status: Locked
Objective: Define the security boundaries, trust model, data protection strategy, and runtime reliability principles of CityOps AI.
This chapter establishes how the system protects user data, isolates failures, validates requests, and maintains reliable operation without exposing internal implementation details.

2.35 Trust Boundaries
CityOps AI separates the system into distinct trust zones.
Every component communicates only across defined boundaries.
+--------------------------------------------------+
|                  User Devices                    |
|--------------------------------------------------|
| Citizen Web App | Authority Dashboard            |
+-------------------------▲------------------------+
                          │ HTTPS
                          ▼
+--------------------------------------------------+
|               Backend API (Trusted)              |
|--------------------------------------------------|
| Authentication                                  |
| Validation                                      |
| Business Logic                                  |
| AI Orchestrator                                 |
+-------------------------▲------------------------+
                          │
                          ▼
+--------------------------------------------------+
|         Google Cloud Managed Services            |
|--------------------------------------------------|
| Firestore | Cloud Storage | Gemini | Maps        |
+--------------------------------------------------+

Trust is never assumed across boundaries.
Every request crossing a trust boundary must be authenticated and validated.

2.36 Authentication Flow
Authentication verifies the identity of every user before protected resources are accessed.
Citizen Authentication
The citizen application requires user authentication before:
Creating reports
Viewing personal reports
Accessing report history
Unauthenticated users cannot submit infrastructure reports.

Authority Authentication
Authority users require authenticated access before:
Viewing municipal tickets
Accessing Human Review Queue
Updating ticket status
Viewing operational recommendations
Authority authentication is independent of citizen authentication.

Authentication Lifecycle
User Login
      │
      ▼
Authentication Provider
      │
      ▼
Identity Verified
      │
      ▼
Access Token Issued
      │
      ▼
Protected API Access

Authentication occurs before any business logic executes.

2.37 Authorization Responsibilities
Authentication answers:
Who are you?
Authorization answers:
What are you allowed to do?
The backend is responsible for authorization.
The frontend shall never enforce security permissions.

Citizen Permissions
Citizens may:
Submit reports
View their own reports
View AI Resolution Summary
Confirm report submission
Citizens may not:
Access other users' reports
Access municipal dashboards
Modify operational recommendations

Authority Permissions
Authorities may:
View all assigned tickets
Review low-confidence reports
Update ticket lifecycle
Mark reports as completed
Authorities may not:
Modify AI reasoning history
Modify citizen-submitted evidence

2.38 Firestore Security Responsibilities
Firestore is the system's operational data store.
Security responsibilities include:
Protect ticket integrity
Prevent unauthorized reads
Prevent unauthorized writes
Preserve audit history
Firestore acts as the single source of truth.
The backend remains responsible for enforcing business rules before persistence.
Firestore security rules provide the final layer of protection.

Firestore Principles
Citizens access only their own reports.
Authorities access operational tickets according to assigned permissions.
Direct client-side database modifications are prohibited.
All ticket lifecycle changes originate through authenticated backend APIs.

2.39 Cloud Storage Security
Cloud Storage stores uploaded infrastructure images.
Responsibilities include:
Secure image persistence
Controlled retrieval
Access isolation
Upload integrity
Images are not publicly accessible.
The backend provides controlled access for AI processing and authorized viewing.
Cloud Storage is never accessed directly by unauthorized clients.

2.40 API Security
The Backend API is the primary security gateway.
Every request SHALL undergo:
Authentication
Authorization
Input Validation
Business Validation
Processing
Requests failing validation terminate immediately.

API Security Principles
Never trust client input.
Validate every request.
Reject malformed payloads.
Reject unauthorized operations.
Return standardized error responses.
Never expose internal infrastructure details.

2.41 AI Safety Constraints
The AI Orchestrator operates within strict safety boundaries.
The AI SHALL NOT:
Access infrastructure directly.
Modify database records.
Execute arbitrary code.
Call unregistered tools.
Bypass authorization.
Produce unsupported ticket states.
The AI reasons only over validated evidence provided through the Tool Registry.
Operational authority always remains with the backend.

Human Oversight
Low-confidence recommendations SHALL:
remain visible,
remain traceable,
require human verification.
AI recommendations are advisory, not authoritative.

2.42 Data Validation Strategy
Validation occurs at multiple layers.
Client
   │
   ▼
Frontend Validation
   │
   ▼
Backend Validation
   │
   ▼
Business Validation
   │
   ▼
AI Processing
   │
   ▼
Persistence


Frontend Validation
Responsibilities:
Required fields
File selection
Basic formatting
Frontend validation improves user experience only.

Backend Validation
Responsibilities:
Authentication
Authorization
Request schema validation
Image availability
GPS availability
Backend validation is authoritative.

Business Validation
Business rules verify:
Supported issue categories
Ticket lifecycle rules
Confidence policies
Human review routing

2.43 Failure Isolation
Failures remain isolated to the component in which they occur.
Maps Failure
      │
      ▼
Road Context Tool
      │
      ▼
Confidence Reduced
      │
      ▼
Continue Processing

Supporting service failures do not cascade across the architecture.
Only unrecoverable failures terminate execution.

Isolation Principles
AI failures do not corrupt persistence.
Storage failures do not affect authentication.
Dashboard failures do not interrupt report creation.
Tool failures remain isolated from other tools.

2.44 Observability
The system shall provide sufficient operational visibility for debugging and evaluation.
Observability includes:
Request lifecycle
AI orchestration progress
Tool execution history
Response times
Error rates
Terminal execution state
Observability supports engineering diagnostics without exposing internal details to end users.

2.45 Logging Strategy
Structured logs shall be generated throughout request execution.
Each request receives a unique Request ID.
The backend records:
Request ID
Timestamp
Authenticated user role
AI iterations
Tools invoked
Execution duration
Final confidence
Terminal state

Sensitive Data Protection
Logs SHALL NOT contain:
Authentication tokens
Passwords
Personal identification
Raw citizen images
Internal credentials
Logs are intended for diagnostics and operational monitoring only.

2.46 Reliability Principles
CityOps AI follows the following reliability principles.
1. Secure by Default
Every component assumes external input is untrusted.

2. Least Privilege
Every component receives only the permissions required for its responsibility.

3. Layered Validation
Validation occurs at the frontend, backend, business, and AI boundaries.
No single validation layer is considered sufficient.

4. Failure Containment
Failures remain localized.
Supporting services degrade confidence rather than causing system-wide failure.

5. Predictable Execution
Every request terminates with a bounded outcome.
Infinite execution and undefined states are prohibited.

6. Responsible AI
AI recommendations remain explainable, confidence-aware, and subject to human oversight.

7. Auditability
Every operational recommendation can be traced through:
uploaded evidence,
AI reasoning,
retrieved context,
final recommendation,
ticket lifecycle.
This ensures transparency for both municipal operators and system maintainers.

Part D Status
Complete
This section defines the security model, trust boundaries, authorization responsibilities, validation strategy, observability, logging, and reliability principles of CityOps AI.
The engineering team now has a complete security and reliability specification that complements the runtime behavior defined in Part C.
The next chapter is:
Chapter 3 — Database Design & Data Model





PROJECT_SPEC.md
Chapter 2 — System Architecture & Component Design
Part E — Engineering Constraints & Non-Functional Requirements
Status: Implementation Specification
Architecture Status: Locked
Objective: Define the engineering expectations, runtime constraints, operational limits, and architectural decisions that govern implementation quality.
This chapter establishes measurable engineering targets without prescribing implementation details.

2.47 Performance Targets
The MVP is designed for a live hackathon demonstration while maintaining engineering discipline.
Functional Performance
The system SHALL:
Accept citizen uploads without blocking the UI.
Process supported issue categories within bounded execution.
Generate a Resolution Summary for every successful submission.
Update the Authority Dashboard after ticket persistence.

AI Performance
The AI Orchestrator SHALL:
Execute at most three tool invocations.
Terminate deterministically.
Produce exactly one terminal outcome.
Never enter an unbounded reasoning loop.

Dashboard Performance
The Authority Dashboard SHALL:
Display newly created tickets shortly after persistence.
Support concurrent viewing by multiple authority users.
Reflect ticket lifecycle updates consistently.

2.48 Latency Budget
The system is optimized for responsiveness during demonstrations.
Component
Target
Frontend validation
< 200 ms
Image upload
< 2 s (network dependent)
Gemini Vision
2–4 s
Tool invocation
< 500 ms per tool (target)
AI reasoning iteration
< 1 s
Firestore persistence
< 300 ms (target)
Dashboard refresh
Near real-time


End-to-End Target
The complete workflow from citizen upload to Resolution Summary should typically complete within:
5–8 seconds
Under degraded conditions:
≤ 12 seconds

Latency Principles
Progress shall remain visible during processing.
Long-running operations shall expose intermediate status.
Latency must remain bounded by the runtime execution contract.

2.49 Scalability Expectations
The MVP is not intended for city-scale production deployment.
However, the architecture shall support reasonable growth.
The system should scale independently across:
Backend API
AI processing
Firestore
Cloud Storage
Horizontal scalability should not require architectural redesign.

Scalability Principles
Stateless backend services.
Shared persistence.
Independent AI requests.
Independent user sessions.

2.50 Availability Targets
The system prioritizes graceful degradation over hard failure.
Availability objectives:
Backend remains available if supporting context services fail.
Ticket creation succeeds whenever core AI processing succeeds.
AI recommendations continue with reduced confidence when optional evidence is unavailable.
Availability target for demonstration:
Best-effort continuous availability throughout the demo session.

2.51 Cost Constraints
The implementation shall remain within hackathon-scale resource usage.
Cost control principles:
Invoke only necessary tools.
Avoid unnecessary AI requests.
Bound orchestration iterations.
Reuse deterministic context where practical.
Minimize repeated infrastructure calls within a single request.
The architecture intentionally optimizes for efficient AI usage rather than maximum automation.

2.52 Resource Limits
The following architectural limits are mandatory.
Resource
Limit
Tool invocations
3
Orchestrator iterations
4
Final recommendation
1
Resolution Summary
1
Ticket per submission
1

These limits prevent runaway execution and simplify testing.

Execution Rules
Every request SHALL terminate in one of the following states:
Verified
Needs Human Review
Processing Failed
No additional terminal states may be introduced without an architectural review.

2.53 Maintainability Principles
The architecture emphasizes long-term maintainability.
Each component has a single responsibility.
Business logic remains independent of:
frontend rendering,
persistence,
infrastructure,
AI prompt design.
Dependencies should flow only toward lower architectural layers.

Change Isolation
Changes to one component should not require modification of unrelated components.
Examples:
Updating AI prompts should not affect Firestore.
Changing the frontend should not affect AI orchestration.
Modifying storage should not affect dashboard logic.

2.54 Extensibility Guidelines
The architecture is intentionally modular.
Future extensions may include:
Additional issue categories.
New retrieval tools.
Additional municipal departments.
Predictive maintenance capabilities.
Analytics modules.
These additions should occur by extending existing interfaces rather than modifying core orchestration behaviour.

Extension Principles
New functionality shall:
preserve existing API contracts,
respect runtime limits,
maintain deterministic execution,
remain compatible with the AI Orchestrator.

2.55 Engineering Assumptions
The following assumptions underpin the implementation.
Citizens provide a valid image.
GPS information is available for most submissions.
Supported issue categories remain limited to the MVP scope.
Google Cloud services are operational.
Network connectivity is available during demonstration.
Authority users possess appropriate credentials.
These assumptions simplify implementation while remaining realistic for the hackathon environment.

2.56 Technical Constraints
The implementation SHALL conform to the following constraints.
Architecture Constraints
Architecture defined in Chapter 1 is immutable.
Runtime execution follows Chapter 2.
AI behaviour follows the Orchestrator model.

Backend Constraints
Backend owns all business logic.
Frontend never performs operational reasoning.
AI never accesses persistence directly.

AI Constraints
AI reasons only over validated evidence.
AI cannot bypass registered tools.
AI cannot create unsupported states.

Data Constraints
Firestore remains the operational source of truth.
Cloud Storage stores uploaded images.
Persistence occurs only after citizen confirmation.

Runtime Constraints
Maximum tool invocations remain fixed.
Infinite reasoning loops are prohibited.
Confidence governs automation.

2.57 Architecture Decisions Log
The following architectural decisions have been formally accepted and locked.
ID
Decision
Status
ADR-001
CityOps AI focuses on municipal triage rather than complaint collection.
Locked
ADR-002
Perception is separated from operational reasoning.
Locked
ADR-003
AI follows an evidence-driven orchestration model.
Locked
ADR-004
Deterministic retrieval precedes AI reasoning.
Locked
ADR-005
Duplicate handling uses deterministic candidate retrieval before AI recommendation.
Locked
ADR-006
Human review is confidence-driven.
Locked
ADR-007
Every confirmed submission creates exactly one ticket.
Locked
ADR-008
Low-confidence tickets are persisted with needs_human_review.
Locked
ADR-009
Runtime execution is bounded by fixed iteration and tool limits.
Locked
ADR-010
Architecture changes require identification of a critical implementation blocker.
Locked

These decisions form the architectural baseline for implementation.

2.58 Final Notes for the Engineering Lead
Before implementation begins, the Engineering Lead shall consider the following principles non-negotiable.
Preserve Architectural Boundaries
Do not collapse frontend, backend, AI, and infrastructure responsibilities.

Preserve Runtime Guarantees
Every request must terminate predictably.
No shortcuts may bypass confidence evaluation or human review routing.

Preserve Explainability
The reasoning timeline and Resolution Summary are core product features.
They must remain visible and understandable.

Preserve Responsible AI
Confidence, evidence, and human oversight take precedence over aggressive automation.

Preserve Scope
Do not introduce:
additional issue categories,
new AI agents,
analytics,
predictive systems,
chatbot functionality,
unless explicitly approved through an architectural review.

2.59 Chapter 2 Completion Checklist
The following items are complete and approved.
Architecture
High-Level System Architecture
Frontend Architecture
Backend Architecture
Google Cloud Architecture

AI
AI Orchestrator
Evidence Loop
Tool Registry
Component Responsibilities
Confidence Flow
Human Review Escalation

Runtime
Runtime Execution Contract
Sequence Diagrams
Runtime Event Flow
Component Communication
State Machine
Failure Behaviour
Retry Strategy
Timeout Behaviour
Graceful Degradation
Error Propagation

Security
Trust Boundaries
Authentication
Authorization
API Security
AI Safety
Validation Strategy
Logging
Reliability Principles

Engineering
Performance Targets
Latency Budget
Scalability
Availability
Cost Constraints
Resource Limits
Maintainability
Extensibility
Engineering Assumptions
Technical Constraints
Architecture Decision Log

Chapter 2 Status
COMPLETE
Chapter 2 now provides a complete implementation blueprint for the Engineering Lead.
The architecture, runtime behaviour, security boundaries, engineering constraints, and operational responsibilities are fully specified and internally consistent.
Ready for Implementation Review.
The next document is:
Chapter 3 — Database Design & Data Model




