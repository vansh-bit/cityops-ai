PROJECT_SPEC.md
Chapter 5 – AI Decision Engine Specification
Part A – AI Architecture
Status: Implementation Specification
Architecture Status: LOCKED

5.1 Purpose
This chapter specifies the architecture of the AI Decision Engine, the core intelligence layer of CityOps AI.
Unlike previous chapters that focused on infrastructure, APIs, and persistence, this chapter defines how the AI system reasons, gathers evidence, and produces municipality-ready operational decisions.
This chapter intentionally focuses on system architecture, not implementation details.
It defines:
AI component responsibilities
Decision architecture
Evidence-driven reasoning
Tool orchestration
Confidence evaluation
Human review integration
Prompt engineering, prompt templates, and model-specific instructions are intentionally deferred to later sections.

5.2 AI Design Philosophy
The AI Decision Engine is designed around one guiding principle:
The AI should transform raw citizen reports into structured operational decisions, not merely classify images.
Traditional complaint systems stop after identifying an issue.
CityOps AI continues beyond perception by collecting additional evidence, evaluating operational context, and generating explainable recommendations.

5.2.1 Why AI Is Used
AI is responsible for tasks requiring contextual reasoning rather than deterministic computation.
Examples include:
Understanding infrastructure damage from images
Assessing severity
Producing human-readable reasoning
Prioritizing operational response
Explaining recommendations
AI is not responsible for deterministic operations such as:
Geospatial filtering
Database queries
Similarity search
Lifecycle management
Authentication
Persistence
These responsibilities remain deterministic system functions.
This separation improves reliability, explainability, and engineering robustness.

5.2.2 Separation of Perception and Reasoning
The AI architecture separates visual understanding from operational reasoning.
Citizen Image
      │
      ▼
Vision Module
(What do I see?)
      │
      ▼
Decision Engine
(What should be done?)

Vision Module
Produces objective observations.
Examples:
issue type
visible damage
initial severity estimate
perception confidence
The Vision Module does not decide operational actions.

Decision Engine
Consumes:
Vision observations
External evidence
Operational context
Produces:
Priority
Department
Merge recommendation
Operational reasoning
Recommended action
Final confidence
This separation reduces prompt complexity and prevents perception errors from being tightly coupled to operational decision-making.

5.2.3 Evidence-Driven Decision Making
The Decision Engine does not assume its initial understanding is sufficient.
Instead, it actively gathers additional evidence before making operational decisions.
Possible evidence includes:
Nearby active reports
Duplicate similarity results
Road classification
Department service constraints
The engine reasons using all available evidence before producing a final recommendation.
This approach improves explainability and reduces unsupported AI decisions.

5.3 AI Component Overview
The AI Decision Engine consists of five logical components.
         Citizen Upload
                 │
                 ▼
         Vision Module
                 │
                 ▼
        Decision Engine
                 │
        ┌────────┴────────┐
        ▼                 ▼
 Tool Registry      Confidence Engine
        │                 │
        └────────┬────────┘
                 ▼
          Human Review

Each component has a single, well-defined responsibility.

5.4 Component Responsibilities

5.4.1 Vision Module
Purpose
Transform raw visual input into structured observations.
Responsibilities
Image understanding
Issue identification
Initial severity estimation
Visual reasoning
Initial confidence estimation
Inputs
Uploaded image
Outputs
Structured perception
Does NOT Own
Tool execution
Operational reasoning
Duplicate detection
Routing decisions
Persistence

5.4.2 Decision Engine
Purpose
Acts as the reasoning core of the AI system.
Responsibilities
Interpret perception output
Determine whether additional evidence is required
Select tools
Integrate evidence
Produce municipality-ready recommendations
Decide when sufficient evidence has been collected
Inputs
Vision output
Tool observations
Outputs
Operational recommendation
Does NOT Own
Database access
Storage
Authentication
Dashboard updates

5.4.3 Tool Registry
Purpose
Expose deterministic system capabilities to the Decision Engine.
The registry enables the AI to request additional information without directly accessing infrastructure services.
Responsibilities
Tool discovery
Tool invocation
Observation delivery
Tool execution logging
Inputs
Tool requests
Outputs
Structured observations

5.4.4 Confidence Engine
Purpose
Evaluate whether the AI possesses sufficient evidence to automate a decision.
Responsibilities
Confidence aggregation
Confidence adjustment
Human review determination
Confidence threshold evaluation
The Confidence Engine does not alter AI reasoning.
It evaluates the reliability of the reasoning process.

5.4.5 Human Review
Purpose
Protect operational integrity when AI confidence is insufficient.
Responsibilities
Receive low-confidence cases
Preserve AI outputs
Enable authority verification
Record manual decisions
Human Review is a safety mechanism, not an AI component.

5.5 Decision Engine Architecture
The Decision Engine is implemented as an evidence-driven reasoning system.
Its internal workflow follows four sequential responsibilities.
Perception
      │
      ▼
Reason
      │
      ▼
Gather Evidence
      │
      ▼
Reason Again
      │
      ▼
Generate Operational Decision

The Decision Engine never skips reasoning.
Evidence gathering is performed only when additional context is required.

5.5.1 Internal Responsibilities
The Decision Engine owns:
Context interpretation
Evidence planning
Tool selection
Evidence synthesis
Operational reasoning
Confidence evaluation trigger
Final recommendation generation
It does not own deterministic system operations.

5.5.2 Evidence Gathering
Evidence gathering is demand-driven.
The engine requests external observations only when they improve decision quality.
Possible evidence includes:
Nearby reports
Road characteristics
Duplicate similarity
Department operational context
Evidence is accumulated incrementally throughout execution.

5.5.3 Reasoning
After each observation, the Decision Engine reassesses whether sufficient evidence has been collected.
Reasoning incorporates:
Visual perception
Retrieved evidence
Operational context
The engine continuously updates its internal understanding before deciding whether additional observations are necessary.

5.5.4 Stopping Decisions
The Decision Engine terminates execution when any of the following conditions is satisfied:
Sufficient evidence has been collected.
No remaining tools can provide meaningful additional evidence.
Maximum tool execution limit has been reached (three tool invocations).
These stopping conditions guarantee bounded execution time and predictable latency.

5.5.5 Final Output Generation
After reasoning completes, the Decision Engine produces:
Operational priority
Responsible department
Recommended action
Merge recommendation
Human-readable reasoning
Final confidence assessment
The output is forwarded to the Confidence Engine for final evaluation.

5.6 Evidence Loop
The AI follows an iterative evidence-driven reasoning loop.
       Initial Perception
               │
               ▼
            Reason
               │
               ▼
     Need More Evidence?
        │            │
      NO             YES
      │               │
      ▼               ▼
Generate        Select Tool
Decision             │
                     ▼
              Execute Tool
                     │
                     ▼
              Observe Result
                     │
                     ▼
                 Reason Again
                     │
                     └───────────────┐
                                     │
                                     ▼
                          Need More Evidence?

The loop terminates under the stopping conditions defined above.
This architecture balances adaptive reasoning with bounded execution.

5.7 Tool Registry
The Tool Registry provides deterministic capabilities to the Decision Engine.
The engine requests observations through standardized tool interfaces.
Tools do not perform reasoning.
They retrieve structured evidence.
Tool
Purpose
Inputs
Outputs
Responsibility
Selection Criteria
Nearby Reports
Retrieve active reports near the incident
Location
Nearby report summary
Operational context
Possible duplicate or clustered reports
Road Metadata
Retrieve road classification
Location
Road category and importance
Infrastructure context
Road-related incidents
Duplicate Search
Identify visually similar reports
Image / Candidate reports
Similarity score
Duplicate evidence
Multiple nearby reports detected
Department SLA
Retrieve department guidelines
Issue type
Operational constraints
Response planning
Department-specific decisions


Tool Selection Principles
The Decision Engine selects tools according to three principles:
Relevance — Only tools capable of improving the current decision are considered.
Efficiency — The minimum number of tools necessary should be executed.
Bounded Execution — Tool execution is limited to preserve latency.
Tool invocation order is dynamic and depends on the evolving evidence collected during reasoning.

5.8 Engineering Principles
The AI Decision Engine follows several architectural principles that govern all future implementation.

5.8.1 Bounded Autonomy
The AI is autonomous only within predefined limits.
It may:
Select tools
Gather evidence
Decide when sufficient evidence exists
It may not:
Modify infrastructure
Bypass validation
Access databases directly
Execute unrestricted loops
Bounded autonomy ensures predictable execution while preserving adaptive reasoning.

5.8.2 Deterministic Reasoning Support
Reasoning is supported by deterministic evidence rather than intuition alone.
Every operational recommendation should be explainable using:
Vision observations
Retrieved tool outputs
Operational constraints
This improves trust, reproducibility, and debugging.

5.8.3 Explainability by Design
Every recommendation produced by the Decision Engine must be explainable.
Operational decisions should be traceable to:
Perception results
Evidence gathered
Reasoning process
Confidence assessment
This supports municipal accountability and simplifies human verification.

5.8.4 Responsible Automation
Automation is permitted only when confidence is sufficient.
When confidence remains below the required threshold:
Automation stops.
Human Review is initiated.
AI recommendations are preserved but not automatically enforced.
This prevents unsafe operational decisions.

5.8.5 Separation of Responsibilities
The AI system maintains strict boundaries between reasoning and deterministic infrastructure.
AI reasons.
Tools retrieve evidence.
Infrastructure stores data.
Authorities retain final operational control.
This separation improves maintainability and reduces system complexity.

Part A Status
Status: COMPLETE
Dependencies
Chapter 1 – Product Vision & Architecture
Chapter 2 – System Architecture & Component Design
Chapter 3 – Database Design & Firestore Specification
Chapter 4 – API Specification & Backend Contracts
Implementation Readiness
READY
The architectural foundations of the AI Decision Engine are fully specified. Component responsibilities, reasoning workflow, evidence loop, tool registry, and engineering principles are now locked. No implementation details, prompt engineering, or data contracts have been introduced.
Next Part
Part B – AI Workflow, Confidence Model & Decision Lifecycle
PROJECT_SPEC.md
Chapter 5 – AI Decision Engine Specification
Part B – Tool Contracts & AI Contracts
Status: Implementation Specification
Architecture Status: LOCKED

5.9 Purpose
This section defines the formal contracts governing every AI component.
These contracts ensure:
deterministic communication between components
consistent AI outputs
structured tool invocation
explainable reasoning
reliable confidence evaluation
These contracts are mandatory for every implementation of the AI Decision Engine.

5.10 Tool Contracts
The Tool Registry exposes deterministic capabilities to the Decision Engine.
Each tool follows a strict input/output contract.
The AI never bypasses these tools.

5.10.1 Nearby Reports Tool
Purpose
Retrieve nearby active reports that may influence operational decisions.
Inputs
Latitude
Longitude
Search radius
Issue type (optional)
Outputs
Nearby report count
Candidate report IDs
Distances
Current status
Report timestamps
Failure Modes
Firestore unavailable
No nearby reports
Invalid coordinates
Query timeout
Latency Target
≤ 250 ms
Dependencies
Firestore
Geospatial index

5.10.2 Road Metadata Tool
Purpose
Provide road context used during operational reasoning.
Inputs
Latitude
Longitude
Outputs
Road classification
Road importance
Operational context
Failure Modes
Maps unavailable
Unknown road
Invalid coordinates
Latency Target
≤ 300 ms
Dependencies
Google Maps Platform

5.10.3 Duplicate Search Tool
Purpose
Identify visually similar reports.
Inputs
Uploaded image
Candidate report IDs
Outputs
Similarity scores
Best candidate
Duplicate confidence
Failure Modes
Embedding unavailable
No candidate reports
Vector search timeout
Latency Target
≤ 500 ms
Dependencies
Firestore Native Vector Search
Multimodal Embeddings

5.10.4 Department SLA Tool
Purpose
Retrieve department operational guidelines.
Inputs
Issue type
Department
Outputs
SLA
Operational constraints
Recommended response target
Failure Modes
Missing department configuration
Configuration service unavailable
Latency Target
≤ 100 ms
Dependencies
Firestore configuration

5.11 Tool Contract Principles
Every tool must satisfy the following requirements.
Rule
Description
TOOL-001
Deterministic output for identical inputs
TOOL-002
Never perform AI reasoning
TOOL-003
Never modify Firestore
TOOL-004
Return structured data only
TOOL-005
Fail safely with explicit error states
TOOL-006
Never invoke other tools
TOOL-007
Execution must be independently testable


5.12 AI Input Contract
The Decision Engine consumes a standardized context.
The context is composed of:
Vision observations
Citizen metadata
Retrieved evidence
Current reasoning state
The engine must never consume raw database documents directly.

Required Input Fields
Image reference
Location
Citizen description (optional)
Vision output
Previously collected evidence
Tool execution history

Validation Requirements
Before reasoning begins:
Image must exist.
Coordinates must be valid.
Vision output must be complete.
Evidence objects must conform to schema.
Tool history must be chronologically ordered.
Invalid contexts terminate execution before reasoning begins.

5.13 AI Output Contract
Every execution produces a structured operational recommendation.
The output must include:
Final issue classification
Severity
Priority
Responsible department
Recommended action
Confidence
Operational reasoning
Citizen summary
Authority summary
Merge recommendation
Verification status
Outputs must remain deterministic in structure even if reasoning differs.

5.14 Confidence Contract
Every Decision Engine execution produces exactly one confidence value.
The confidence represents the engine's trust in the operational recommendation.

Confidence Range
0.00  ------------------------------ 1.00
Low Confidence                High Confidence

Confidence must always be normalized to:
0.00 – 1.00

Confidence Categories
Range
Category
0.90 – 1.00
Very High
0.75 – 0.89
High
0.60 – 0.74
Medium
Below 0.60
Low

The exact threshold values are implementation constants but must remain consistent across the system.

5.15 Reasoning Contract
Reasoning must satisfy the following requirements.
Every recommendation must be:
understandable
explainable
operationally useful
Reasoning should reference:
visual observations
gathered evidence
operational context
Reasoning must never fabricate unavailable evidence.

Reasoning Constraints
Reasoning must:
remain concise
avoid speculation
avoid unsupported assumptions
align with retrieved evidence
remain internally consistent

5.16 Human Review Contract
When confidence falls below the automation threshold:
Automation stops.
The Decision Engine produces a review package instead of an executable work order.

Human Review Package
Contains:
AI recommendation
Confidence score
Evidence summary
Tool execution history
Reasoning
Review justification
The authority reviewer becomes the final decision maker.

5.17 Prompt Contracts
Prompt engineering is intentionally separated from system architecture.
This section specifies behavioral contracts, not prompt text.

System Prompt Responsibilities
The system prompt must instruct the model to:
behave as a municipal decision assistant
follow tool contracts
respect stopping conditions
produce structured outputs
avoid unsupported assumptions

Output Constraints
The model must:
return structured output only
avoid conversational responses
avoid markdown
avoid natural-language introductions
avoid omitted required fields

Structured Output Requirements
Outputs must satisfy:
fixed schema
consistent field names
deterministic structure
required confidence field
required reasoning field
required operational recommendation
The schema itself is defined in later implementation documents.

Tool Calling Expectations
The Decision Engine may invoke tools only through the registered Tool Registry.
Tool invocation must satisfy:
explicit purpose
bounded execution
deterministic inputs
deterministic outputs
The model must never invent tool responses.

5.18 Confidence Model
Confidence is evaluated after reasoning completes.
It represents the overall reliability of the operational recommendation.

Confidence Inputs
Confidence considers:
Vision certainty
Evidence completeness
Duplicate certainty
Operational consistency
Tool success
Missing evidence
Confidence is reduced when deterministic evidence is unavailable.

Confidence Thresholds
The Confidence Engine classifies every decision into one of two outcomes:
Confidence
      │
      ▼
Above Threshold?
      │
 ┌────┴────┐
 │         │
YES        NO
 │         │
 ▼         ▼
Verified   Human Review

Threshold values remain configurable but globally consistent.

Escalation Policy
Low-confidence recommendations are never automatically operationalized.
Instead:
preserve reasoning
preserve evidence
preserve AI recommendation
forward to authority review

Conflict Resolution
Conflicting evidence follows deterministic precedence.
Priority order:
Deterministic tool evidence
Vision observations
AI reasoning
The Decision Engine must never override deterministic evidence without explicit justification.

5.19 Human Review Policy
Human Review is the final safeguard in the AI pipeline.

Escalation Conditions
Escalation occurs when:
confidence below threshold
insufficient evidence
conflicting evidence
repeated tool failures
unsupported operational recommendation

Manual Verification
Authority reviewers may:
approve
modify
reject
Every manual action generates an immutable Audit Log.
Original AI recommendations remain unchanged.

Authority Workflow
Authority reviewers receive:
AI recommendation
confidence
evidence summary
reasoning
tool history
The reviewer never receives raw model internals.
The authority decision becomes the final operational state.

5.20 AI Contract Invariants
The following rules are mandatory.
ID
Rule
AI-001
Every execution begins with Vision Module output.
AI-002
All reasoning uses structured evidence.
AI-003
Tools never perform reasoning.
AI-004
Decision Engine never accesses infrastructure directly.
AI-005
Confidence is generated exactly once per execution.
AI-006
Every operational recommendation includes reasoning.
AI-007
Human Review preserves original AI output.
AI-008
AI Decisions remain immutable after creation.
AI-009
Tool failures reduce confidence rather than terminate execution whenever possible.
AI-010
Structured output format is mandatory for every execution.


Part B Status
Status: COMPLETE
Ready for Review
YES
Implementation Readiness
READY
The AI contracts are now fully specified. Tool interfaces, AI input/output expectations, confidence evaluation, prompt responsibilities, structured output constraints, and human review policies are defined independently of runtime execution, providing a stable contract for both AI implementation and backend integration.
Next Part
Part C – Runtime AI Workflow & Decision Lifecycle
PROJECT_SPEC.md
Chapter 5 – AI Decision Engine Specification
Part C – Runtime Behaviour
Status: Implementation Specification
Architecture Status: LOCKED

5.21 Purpose
This section defines the runtime behavior of the AI Decision Engine.
Unlike Parts A and B, which specify architecture and contracts, this section specifies how the AI system executes during runtime.
It defines:
execution lifecycle
reasoning sequence
evidence gathering
tool execution
stopping behavior
failure recovery
latency constraints
observability
This chapter intentionally excludes prompt engineering.

5.22 Runtime Execution Lifecycle
Every citizen report follows the same high-level execution lifecycle.
Citizen Upload
      │
      ▼
Vision Module
      │
      ▼
Initialize Decision Engine
      │
      ▼
Reason
      │
      ▼
Need More Evidence?
      │
 ┌────┴─────┐
 │          │
No          Yes
 │           │
 ▼           ▼
Confidence   Tool Execution
Evaluation      │
 │              ▼
 │         Observation
 │              │
 │              ▼
 │         Reason Again
 │              │
 └──────────────┘
      │
      ▼
Generate Final Decision
      │
      ▼
Confidence Evaluation
      │
      ▼
Verified / Human Review

This lifecycle is mandatory for every execution.

5.23 Runtime Reasoning Sequence
The Decision Engine reasons incrementally rather than producing an immediate operational recommendation.
Each execution follows five logical phases.
Phase 1 – Initialization
Inputs are validated.
Execution context is created.
The engine receives:
Vision output
Citizen metadata
Current execution state
No tools are executed during initialization.

Phase 2 – Initial Reasoning
The engine evaluates whether current information is sufficient.
Questions considered include:
Is the issue understood?
Is operational context missing?
Can confidence already support automation?
If sufficient evidence already exists, the engine skips directly to decision generation.

Phase 3 – Evidence Gathering
If additional information is required, the Decision Engine selects the most appropriate tool.
Only one tool is selected per reasoning iteration.
Tool execution produces structured observations.

Phase 4 – Evidence Integration
Returned observations are incorporated into the reasoning context.
The Decision Engine reassesses:
confidence
operational context
remaining uncertainty
The engine then decides whether another tool is required.

Phase 5 – Decision Finalization
Execution terminates when one of the stopping conditions is satisfied.
The engine produces:
operational recommendation
confidence
reasoning
summaries
review status

5.24 Runtime Sequence Diagram
Citizen
    │
    ▼
Vision Module
    │
    ▼
Decision Engine
    │
    ▼
Reason
    │
    ▼
Need Evidence?
    │
 ┌──┴──────────────┐
 │                 │
No                 Yes
 │                  │
 ▼                  ▼
Generate        Tool Registry
Decision             │
                     ▼
             Execute Selected Tool
                     │
                     ▼
             Structured Observation
                     │
                     ▼
              Decision Engine
                     │
                     ▼
                Reason Again
                     │
          ┌──────────┴──────────┐
          │                     │
     Need More             Enough
     Evidence              Evidence
          │                     │
          └──────────┬──────────┘
                     ▼
            Confidence Engine
                     │
          ┌──────────┴──────────┐
          │                     │
      Verified          Human Review


5.25 Tool Execution
The Decision Engine never executes deterministic operations directly.
All infrastructure interactions occur through registered tools.
Tool execution follows four stages.
Select Tool
      │
      ▼
Validate Inputs
      │
      ▼
Execute Tool
      │
      ▼
Receive Observation

Observations are immutable once returned.
The Decision Engine cannot modify tool outputs.

5.26 Tool Execution Rules
The following rules govern runtime tool execution.
Rule
Description
RT-001
Execute one tool per reasoning iteration
RT-002
Tool outputs are immutable
RT-003
Failed tools return structured failure objects
RT-004
Tool execution never modifies Firestore
RT-005
Every tool execution is logged
RT-006
Tool outputs become part of reasoning context


5.27 Stopping Criteria
Execution terminates immediately when one of the following conditions is met.
SC-001
Sufficient evidence collected.

SC-002
No additional registered tool can improve confidence.

SC-003
Maximum tool execution limit reached.

SC-004
Critical validation failure.

SC-005
Fatal infrastructure failure preventing safe reasoning.

5.28 Maximum Iterations
The Decision Engine is intentionally bounded.
Maximum tool executions:
3

Maximum reasoning cycles:
4

Initial Reasoning
+ Three Evidence Iterations

Unlimited execution is prohibited.
Bounded execution guarantees:
predictable latency
bounded API costs
prevention of infinite reasoning loops

5.29 Failure Handling
Failures are categorized by recoverability.
Recoverable
temporary Firestore timeout
temporary Storage timeout
Maps timeout
transient network interruption
Execution continues where possible.

Non-Recoverable
invalid Vision output
malformed execution context
Gemini inference failure
authentication failure
Execution terminates safely.
No undefined behavior is permitted.

5.30 Graceful Degradation
Whenever possible, failures reduce confidence instead of terminating execution.
Examples:
Road Metadata unavailable
        │
        ▼
Continue execution
        │
        ▼
Lower confidence

Duplicate Search timeout
        │
        ▼
Continue execution
        │
        ▼
Human Review more likely

Only failures preventing safe reasoning terminate execution.

5.31 Retry Strategy
Retries are intentionally conservative.
Allowed Retries
Maximum one retry:
Firestore
Storage
Network

Prohibited Retries
No automatic retries for:
Gemini inference
Decision Engine reasoning
Tool selection
Validation failures
These restrictions preserve deterministic behavior and maintain the latency budget defined in Chapter 2.

5.32 Latency Budget
Runtime latency is divided across execution stages.
Component
Target
Vision Module
≤ 2.5 s
Decision Engine reasoning
≤ 0.5 s
Tool execution (each)
≤ 0.5 s
Confidence evaluation
≤ 0.2 s
Final response generation
≤ 0.3 s


Overall Target
End-to-End AI Processing

≤ 6 seconds (typical)

≤ 8 seconds (maximum acceptable)

These limits support the live hackathon demo and align with the system's non-functional requirements.

5.33 Observability
Every execution must be observable.
Observability supports:
debugging
performance tuning
operational monitoring
demo diagnostics
Observability consists of:
logging
metrics
tracing

5.34 Logging Strategy
Each execution generates structured logs.
Required events:
execution started
Vision completed
reasoning iteration started
tool selected
tool completed
confidence evaluated
execution finished
execution failed
Logs must include:
execution ID
request ID
timestamp
service
duration
Sensitive user data must never appear in logs.

5.35 Metrics
The following runtime metrics are mandatory.
Metric
Description
AI execution duration
End-to-end processing time
Vision latency
Vision Module duration
Average reasoning iterations
Mean reasoning cycles
Tool invocation frequency
Tool usage distribution
Tool latency
Execution time per tool
Human review rate
Percentage escalated
Confidence distribution
Confidence histogram
Failure rate
Failed executions
Average total latency
Overall AI runtime

Metrics are used for monitoring and future optimization.

5.36 Distributed Tracing
Each execution receives a unique trace identifier.
Execution ID
      │
      ▼
Vision
      │
      ▼
Reasoning
      │
      ▼
Tool Calls
      │
      ▼
Confidence
      │
      ▼
Final Decision

Every service involved in execution must propagate the same trace identifier.
This enables complete reconstruction of a single AI execution for debugging and audit purposes.

5.37 Runtime Invariants
The following runtime guarantees are mandatory.
ID
Rule
RUN-001
Vision executes exactly once.
RUN-002
Tool execution is bounded to three invocations.
RUN-003
Tool outputs are immutable.
RUN-004
Every reasoning cycle is logged.
RUN-005
Every execution produces one confidence value.
RUN-006
Every execution ends in Verified or Human Review.
RUN-007
No automatic Gemini retries are permitted.
RUN-008
Runtime failures never corrupt persisted data.
RUN-009
Trace IDs are propagated across all services.
RUN-010
End-to-end latency should remain within the defined budget.


Part C Status
Status: COMPLETE
Ready for Review
YES
Implementation Readiness
READY
The runtime behavior of the AI Decision Engine is now fully specified. Execution lifecycle, reasoning sequence, evidence gathering, tool execution rules, stopping criteria, bounded iterations, failure handling, graceful degradation, retry policies, latency budgets, observability, logging, metrics, and tracing have all been defined. This provides the Engineering Lead with a complete runtime specification without exposing implementation-specific logic or prompt engineering.
Next Part
Part D – Prompt Engineering & Model Specification
PROJECT_SPEC.md
Chapter 5 – AI Decision Engine Specification
Part D – Prompt Engineering & AI Governance
Status: Implementation Specification
Architecture Status: LOCKED

5.38 Purpose
This section defines the governance framework for prompt engineering within the CityOps AI Decision Engine.
The previous parts defined:
AI Architecture
AI Contracts
Runtime Behaviour
This section specifies how prompts are designed, validated, governed, versioned, evaluated, and maintained.
The objective is to ensure that prompt evolution never compromises architectural consistency, explainability, or operational safety.
Prompt engineering is treated as an engineering discipline rather than an ad hoc implementation detail.

5.39 Prompt Engineering Principles
Every prompt used by the AI Decision Engine shall follow a consistent engineering methodology.
Prompts are considered production artifacts and must be:
version controlled
reviewed
reproducible
testable
deterministic in structure
Prompt quality is evaluated on operational performance rather than linguistic sophistication.

5.39.1 Separation of Responsibilities
Each prompt has exactly one responsibility.
Prompt responsibilities must never overlap.
Prompt
Responsibility
Vision Prompt
Visual understanding only
Decision Prompt
Operational reasoning
Tool Selection Prompt
Evidence planning
Confidence Prompt (if implemented separately)
Confidence assessment only

A single prompt must never attempt to perform multiple unrelated reasoning tasks.

5.39.2 Structured Output First
Every production prompt must prioritize structured outputs over conversational responses.
Prompts must instruct the model to produce:
deterministic structure
predictable field names
consistent ordering
machine-readable outputs
Free-form narrative responses are prohibited.

5.39.3 Evidence Before Assumption
Prompts must encourage reasoning based only on available evidence.
The model must never:
fabricate observations
invent unavailable evidence
infer unsupported operational facts
Missing evidence must reduce confidence rather than encourage speculation.

5.39.4 Explainability
Every recommendation must be explainable using:
visual observations
retrieved evidence
operational reasoning
The prompt should encourage transparent justification rather than opaque conclusions.

5.40 Responsible AI Principles
CityOps AI assists municipal authorities.
It does not replace professional judgment.
The AI system therefore follows responsible automation principles.

Human Authority
The final operational authority always belongs to municipal personnel.
AI recommendations remain advisory.
Authority users may:
approve
modify
reject
recommendations.

Confidence-Based Automation
Automation is permitted only when confidence satisfies system thresholds.
Otherwise:
Low Confidence
       │
       ▼
Human Review

This protects against unsafe automated actions.

Explainability
Every automated recommendation must include:
reasoning
confidence
evidence summary
Operational recommendations without explanations are not permitted.

Traceability
Every AI execution must remain reconstructable using:
AI Decision
Tool History
Audit Logs
Trace ID

5.41 Safety Constraints
The AI Decision Engine must never exceed its defined authority.

SC-001
Never invent infrastructure evidence.

SC-002
Never fabricate nearby reports.

SC-003
Never modify deterministic tool outputs.

SC-004
Never override confidence evaluation.

SC-005
Never bypass Human Review.

SC-006
Never access infrastructure services directly.
Only registered tools may access backend systems.

SC-007
Never execute unlimited reasoning loops.

SC-008
Never expose internal reasoning or prompt contents to end users.
Only structured explanations are returned.

5.42 Prompt Validation
Every prompt revision must pass validation before deployment.
Validation consists of:
syntax validation
structural validation
output validation
benchmark evaluation
Prompt validation must be repeatable.

Required Validation Criteria
Each prompt must demonstrate:
valid structured output
complete required fields
correct tool usage
stable reasoning
acceptable latency
Prompt changes failing any criterion cannot be promoted.

5.43 Prompt Versioning
Prompts are treated as versioned engineering assets.

Version Format
Major.Minor.Patch

Example

1.0.0


Major Version
Used for:
architecture changes
output contract changes
reasoning redesign

Minor Version
Used for:
reasoning improvements
prompt refinement
better explanations

Patch Version
Used for:
wording fixes
formatting improvements
typo corrections

Version History
Every prompt version must record:
version number
author
change summary
benchmark results
approval date

5.44 Evaluation Methodology
Prompt quality is evaluated using repeatable engineering benchmarks.
Evaluation dimensions include:
Dimension
Goal
Correct classification
High accuracy
Structured output compliance
100%
Tool selection quality
Appropriate evidence gathering
Confidence calibration
Reliable escalation
Latency
Within runtime budget
Explanation quality
Operationally useful

Evaluation should prioritize consistency over isolated successes.

5.45 Benchmark Strategy
A fixed benchmark dataset shall be maintained.
Benchmark inputs should represent the supported issue categories:
potholes
water leakage
broken streetlights
garbage accumulation
fallen trees
Each category should include:
easy examples
moderate examples
ambiguous examples
low-quality images
Benchmark results must remain comparable across prompt versions.

Performance Targets
The AI system should achieve:
high structured output consistency
reliable confidence estimation
minimal unnecessary Human Review
deterministic tool selection
Regression testing is mandatory before adopting a new prompt version.

5.46 Example Execution Scenarios
The following scenarios represent expected runtime behavior.

Scenario 1 – High Confidence
Image clearly shows a pothole.
Nearby reports exist.
Road metadata confirms an arterial road.
Expected outcome:
verified recommendation
merge suggested
high confidence
no Human Review

Scenario 2 – Medium Confidence
Image quality is acceptable.
Road context unavailable.
Duplicate similarity inconclusive.
Expected outcome:
recommendation generated
moderate confidence
operational explanation included

Scenario 3 – Low Confidence
Image heavily blurred.
No reliable evidence available.
Expected outcome:
no automated decision
Human Review initiated
reasoning preserved

Scenario 4 – Infrastructure Failure
Road Metadata tool unavailable.
Expected outcome:
continue execution
reduced confidence
recommendation produced when safe

5.47 Edge Cases
The AI system must handle unusual situations predictably.
Examples include:
night-time images
heavy rain
partial obstruction
multiple issue types
GPS inaccuracies
duplicate citizen uploads
damaged image files
unsupported issue categories
Edge cases should trigger confidence reduction rather than speculative reasoning.

5.48 Common Failure Cases
Known AI failure modes include:
Failure
Expected Behaviour
Blurry image
Lower confidence
Missing GPS
Validation failure
Duplicate tool failure
Continue if safe
Conflicting evidence
Human Review
Unsupported issue
Human Review
Invalid structured output
Reject execution
Tool timeout
Graceful degradation
Low confidence
Escalation

The system must fail safely rather than produce unreliable recommendations.

5.49 Implementation Notes
Engineering teams should implement prompts independently from application logic.
Recommendations:
Store prompts outside business logic.
Version prompts alongside source control.
Benchmark every prompt revision.
Preserve backward compatibility of structured outputs.
Keep prompt responsibilities isolated.
Never couple prompts to UI logic.
Never hard-code prompt text inside controllers or services.
Prompt governance should follow the same review process as source code.

5.50 AI Governance Principles
The following governance rules are mandatory.
ID
Rule
GOV-001
Prompts are version-controlled engineering assets.
GOV-002
Prompt responsibilities remain isolated.
GOV-003
Structured output contracts are immutable within a major version.
GOV-004
AI must reason only from available evidence.
GOV-005
Confidence governs automation.
GOV-006
Human Review remains mandatory below threshold.
GOV-007
Prompt revisions require benchmark validation.
GOV-008
Prompt changes must not alter architecture.
GOV-009
Prompt engineering must preserve explainability.
GOV-010
Governance rules take precedence over optimization attempts.


5.51 Chapter 5 Completion Checklist
AI Architecture
✓ Vision Module defined
✓ Decision Engine defined
✓ Tool Registry defined
✓ Confidence Engine defined
✓ Human Review defined

AI Contracts
✓ Tool contracts complete
✓ AI contracts complete
✓ Structured output expectations defined
✓ Confidence model documented
✓ Human Review policy documented

Runtime Behaviour
✓ Execution lifecycle documented
✓ Tool execution documented
✓ Failure handling documented
✓ Graceful degradation defined
✓ Retry strategy documented
✓ Observability specified

Prompt Engineering & Governance
✓ Prompt engineering principles documented
✓ Prompt validation process defined
✓ Prompt versioning documented
✓ Evaluation methodology defined
✓ Benchmark strategy documented
✓ Example execution scenarios included
✓ Edge cases documented
✓ Common failure cases documented
✓ AI governance rules defined

Overall Verification
✓ Tool contracts complete
✓ Runtime complete
✓ Confidence defined
✓ Human Review defined
✓ Prompt governance complete
✓ Ready for implementation

Final Chapter Status
Chapter 5 – COMPLETE & LOCKED
Implementation Readiness
READY
The AI Decision Engine has now been fully specified across architecture, contracts, runtime behavior, and governance. The Engineering Lead can implement the AI subsystem without making additional architectural decisions. Future prompt improvements may occur through controlled versioning, but the overall architecture and AI workflow are frozen.
Ready for Technical Review
YES
Next Chapter
Chapter 6 – Frontend Architecture & UI Specification

