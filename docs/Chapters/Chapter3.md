Yes. Based on the final locked architecture and the review, here is the regenerated Chapter 3 – Part A.1. This version incorporates:
Removed review_queue collection
Draft reports (pending_confirmation)
Draft work_orders
Ticket terminology
Updated ownership
Updated Firestore architecture
Consistent with Chapters 1 & 2

PROJECT_SPEC.md
Chapter 3 — Database Design & Firestore Specification
Part A.1 — Firestore Architecture & Collection Design
Status: Implementation Specification
Architecture Status: LOCKED
Objective
Define the overall persistence architecture of CityOps AI, the database philosophy, and the ownership model of every Firestore collection.
This chapter establishes what data exists, why it exists, who owns it, and how it is organized.
No implementation decisions should be required by the Engineering Lead after this chapter.

3.1 Database Design Philosophy
CityOps AI uses Google Cloud Firestore as its primary operational database.
Firestore was selected because it naturally complements the overall architecture established in Chapters 1 and 2.
The application is fundamentally event-driven rather than relational.
Each citizen report progresses independently through a finite operational lifecycle, making Firestore's document-oriented architecture significantly more suitable than a relational database.

Why Firestore
Firestore provides:
Native Google Cloud integration
Real-time synchronization
Serverless scalability
Flexible document schemas
Low operational overhead
Native Firebase Authentication integration
Excellent support for event-driven applications
These capabilities directly align with the objectives of the project.

Why Not SQL
CityOps AI does not require:
Complex joins
Relational normalization
Cross-table transactions
Analytical reporting
Instead, the application requires:
Fast document retrieval
Independent ticket lifecycles
Real-time dashboard updates
Flexible AI-generated metadata
Horizontal scalability
Firestore is therefore the preferred persistence technology.

3.2 Database Design Principles
The persistence layer follows six architectural principles.

Principle 1 — Document-Oriented Storage
Every real-world entity exists as an independent document.
Examples include:
User
Report
Work Order
AI Decision
Audit Event
Documents evolve independently throughout their lifecycle.

Principle 2 — Controlled Denormalization
Frequently accessed information is intentionally duplicated when it reduces Firestore reads.
Examples include:
issue type
department
priority
current status
inside the Work Order document.
Read performance is prioritized over storage optimization.

Principle 3 — Single Source of Truth
Every entity has one authoritative document.
Derived information may exist for performance purposes but must never become the authoritative record.
Examples:
Work Order owns operational status.
AI Decision owns AI reasoning.
Report owns citizen submission.

Principle 4 — Immutable AI History
AI reasoning must never be overwritten.
The AI Decision document preserves:
visual reasoning
evidence collected
confidence evolution
tool execution history
final recommendation
Authority actions update operational records only.
Historical AI reasoning remains immutable.

Principle 5 — Bounded Documents
Firestore documents must remain small.
Collections expected to grow over time (Audit Logs, AI Decisions) remain independent.
Large arrays shall never accumulate inside operational documents.

Principle 6 — Backend Ownership
The frontend never owns operational state.
Every persistence operation originates from authenticated backend services.
This preserves the trust boundaries defined in Chapter 2.

3.3 Business Entity Model
Within the project, the word Ticket refers to the complete operational object managed by the municipality.
A Ticket is not a Firestore collection.
It is the logical combination of two persistent documents.
Ticket

├── Report
│     Citizen submission
│
└── Work Order
      Municipality operational record

This distinction separates citizen-provided information from municipality-owned operational data.
Throughout the remainder of this specification:
Report refers to the citizen-facing record.
Work Order refers to the municipality-facing operational record.
Ticket refers to the combined business concept.

3.4 Firestore Collection Overview
The persistence layer consists of seven primary collections.
Firestore

├── users
├── reports
├── work_orders
├── ai_decisions
├── audit_logs
├── embeddings
└── dashboard_metadata

Each collection owns exactly one responsibility.
No collection duplicates another collection's purpose.

3.5 Collection Specifications

Collection: users
Purpose
Store authenticated citizen and authority profiles.

Owner
Authentication Service

Lifetime
Persistent

Relationships
One User
↓
Many Reports

One Authority User
↓
Many Work Orders

Collection: reports
Purpose
Store the citizen submission from the moment AI processing completes.
The Report document is created before citizen confirmation.
Its initial lifecycle state is:
pending_confirmation

After citizen confirmation it becomes:
confirmed

If the citizen abandons the workflow, the report remains in the draft state until cleanup policies are applied.
This architecture ensures the backend—not the frontend—owns the AI-generated payload.

Owner
Report Service

Lifetime
Persistent

Relationships
One Report
↓
One AI Decision
↓
One Work Order

Collection: work_orders
Purpose
Store the municipality-ready operational recommendation.
Unlike the Report, the Work Order is owned entirely by the municipal workflow.
The Work Order is created immediately after AI processing in the state:
pending_confirmation

Following citizen confirmation:
pending_confirmation

↓

active

or
pending_confirmation

↓

needs_human_review

depending on the final confidence evaluation.
Creating the Work Order before confirmation guarantees that AI processing is executed only once.
No second AI execution is required.

Owner
Operational Workflow Service

Lifetime
Persistent

Relationships
One Work Order
↓
One Report
↓
One AI Decision
↓
Authority Dashboard

Collection: ai_decisions
Purpose
Store the complete reasoning produced by the AI Orchestrator.
Includes:
perception output
evidence collected
confidence progression
tool execution history
operational reasoning
final recommendation
This collection provides explainability, debugging support, and auditability.

Owner
AI Orchestrator

Lifetime
Persistent

Collection: audit_logs
Purpose
Maintain an immutable history of operational events.
Examples include:
ticket activation
authority review
status changes
completion
escalation
human review actions
Operational documents remain mutable.
Audit history never changes.

Owner
Backend Services

Lifetime
Long-term

Collection: embeddings
Purpose
Store multimodal embeddings used exclusively for duplicate detection.
Embeddings are operational artifacts.
They are intentionally isolated from Report and Work Order documents to keep operational queries lightweight.

Owner
Duplicate Detection Service

Lifetime
Persistent

Collection: dashboard_metadata
Purpose
Store lightweight aggregated information required by the Authority Dashboard.
Examples:
ticket counters
active issue counts
dashboard statistics
queue summaries
Dashboard metadata is derived information.
It must never become the operational source of truth.

Owner
Dashboard Service

Lifetime
Persistent

3.6 Collection Ownership
Authentication Service
        │
        ▼
      users

Report Service
        │
        ▼
     reports

AI Orchestrator
        │
        ▼
   ai_decisions

Operational Workflow
        │
        ▼
   work_orders

Backend Services
        │
        ▼
   audit_logs

Duplicate Detection
        │
        ▼
   embeddings

Dashboard Service
        │
        ▼
dashboard_metadata

Ownership is exclusive.
Each service is solely responsible for creating and updating documents within its collection.
Other services interact through defined backend contracts rather than direct ownership.

Part A.1 Status
Complete
This section defines:
Firestore design philosophy
Database architecture principles
Business entity model
Collection overview
Collection responsibilities
Collection ownership
The persistence architecture is now aligned with the locked runtime architecture from Chapter 2.
Next Section: Chapter 3 – Part A.2: Collection Relationships, Firestore Design Decisions & Engineering Rationale

Excellent. This completes Chapter 3 – Part A. This section focuses on the logical relationships between collections, the Firestore architecture decisions, and the engineering rationale behind the persistence model.

PROJECT_SPEC.md
Chapter 3 — Database Design & Firestore Specification
Part A.2 — Collection Relationships & Persistence Architecture
Status: Implementation Specification
Architecture Status: LOCKED
Objective
Define how Firestore collections relate to one another, document the architectural decisions governing persistence, and explain the engineering rationale behind the database design.
This section finalizes the high-level persistence model before individual document schemas are specified in Part B.

3.7 Collection Relationships
The persistence layer separates responsibilities into independent collections while maintaining logical relationships between business entities.
Unlike relational databases, Firestore does not enforce foreign keys. Relationships are maintained through document references and immutable identifiers.
The primary business entity is the Ticket, which consists of:
               Ticket
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
     Report             Work Order
        │                     │
        │                     ▼
        │              Authority Dashboard
        │
        ▼
 AI Decision
        │
        ▼
 Embeddings

Audit Logs observe the complete lifecycle.

The Ticket itself is a logical concept and is never stored as a separate document.

3.8 Entity Relationship Diagram
                   users
                      │
                  1 : N
                      │
                      ▼
                  reports
                      │
          ┌───────────┼────────────┐
          │           │            │
          ▼           ▼            ▼
   ai_decisions  work_orders  embeddings
                      │
                      │
                      ▼
             dashboard_metadata
                      │
                      ▼
                 audit_logs


Relationship Summary
Parent
Child
Cardinality
User
Report
1 : N
Report
AI Decision
1 : 1
Report
Work Order
1 : 1
Report
Embedding
1 : 1
Work Order
Audit Logs
1 : N
Work Order
Dashboard Metadata
Derived


3.9 Report → AI Decision Relationship
Each report produces exactly one AI Decision.
Citizen Upload

↓

Report

↓

AI Decision

The AI Decision stores:
visual understanding
evidence gathered
confidence evolution
reasoning
operational recommendation
verification notes
The AI Decision is immutable.
Subsequent authority actions never modify this document.

3.10 Report → Work Order Relationship
Each report owns exactly one Work Order.
Report

↓

Work Order

The Work Order represents the municipality-facing operational record.
Unlike the Report, it evolves throughout its lifecycle.
Possible states include:
pending_confirmation

↓

active

↓

in_progress

↓

completed

↓

archived

or
pending_confirmation

↓

needs_human_review

↓

active

↓

in_progress

↓

completed

The Work Order is the operational source of truth for municipal workflows.

3.11 Work Order → Audit Log Relationship
Every operational state transition produces a new Audit Log entry.
Work Order

↓

Audit Event

↓

Audit Event

↓

Audit Event

Examples include:
Activated
Escalated
Assigned
Reviewed
In Progress
Completed
Archived
Audit Logs are append-only.
Existing entries are never modified.

3.12 Report → Embedding Relationship
Each report generates one embedding document.
Report

↓

Embedding

The embedding is generated once after AI perception.
It supports:
duplicate detection
similarity search
The embedding is not used during normal dashboard queries.
Keeping embeddings separate reduces document size and improves read performance.

3.13 Dashboard Metadata Relationship
Dashboard Metadata is entirely derived.
Work Orders

↓

Dashboard Metadata

Examples include:
Active issue count
Human review count
Completed today
Department summaries
Dashboard Metadata is an optimization layer.
It never replaces operational records.
If deleted, it can be regenerated entirely from Work Orders.

3.14 Firestore Lifecycle Relationships
The persistence lifecycle follows a deterministic progression.
Citizen Upload
        │
        ▼
Cloud Storage
        │
        ▼
Draft Report
(status = pending_confirmation)
        │
        ▼
AI Decision
        │
        ▼
Draft Work Order
(status = pending_confirmation)
        │
        ▼
Citizen Confirmation
        │
        ▼
Report
(status = confirmed)
        │
        ▼
Work Order

(active)

OR

(needs_human_review)
        │
        ▼
Authority Dashboard
        │
        ▼
Audit Logs
        │
        ▼
Completed
        │
        ▼
Archived

This lifecycle guarantees that:
AI executes only once.
The frontend never owns operational state.
Persistence begins before citizen confirmation.
Human review is represented through Work Order status rather than a separate collection.

3.15 Firestore Design Decisions
The following persistence decisions are permanently locked.
ID
Decision
Status
DB-001
Firestore is the primary operational database.
Locked
DB-002
Cloud Storage stores uploaded images.
Locked
DB-003
Every submission creates a Draft Report with status pending_confirmation.
Locked
DB-004
Every report generates exactly one AI Decision.
Locked
DB-005
Every submission also creates a Draft Work Order. Confirmation activates the Work Order rather than creating a new one.
Locked
DB-006
Human Review is represented by the status field of the Work Order (needs_human_review). No separate review_queue collection exists.
Locked
DB-007
Audit history is immutable and stored separately.
Locked
DB-008
Embeddings remain isolated from operational documents.
Locked
DB-009
Dashboard Metadata is derived and never becomes the source of truth.
Locked
DB-010
Controlled denormalization is preferred over runtime joins.
Locked
DB-011
A Ticket is the logical aggregate of a Report and its associated Work Order.
Locked

These decisions must not be altered without a formal architectural review.

3.16 Engineering Rationale
The persistence architecture was designed around five principles.
Separation of Responsibilities
Each collection owns one responsibility.
Business logic is simplified because ownership is explicit.

Read Optimization
Municipal dashboards perform significantly more reads than writes.
Controlled denormalization minimizes Firestore reads and reduces latency.

Explainable AI
AI reasoning is permanently preserved.
Operational changes never overwrite historical AI decisions.
This supports transparency, debugging, and hackathon judging.

Scalable NoSQL Design
Collections grow independently.
Large historical data (audit logs, AI decisions) cannot inflate operational documents.
This keeps query performance predictable.

Secure Backend Ownership
Persistence begins immediately after AI processing.
The frontend never stores or controls the AI-generated recommendation.
This preserves the trust boundaries established in Chapter 2.

3.17 Part A Completion Summary
The persistence architecture now defines:
✓ Database philosophy
✓ Firestore design principles
✓ Business entity model
✓ Collection hierarchy
✓ Collection ownership
✓ Collection relationships
✓ Firestore lifecycle
✓ Architecture decisions
✓ Engineering rationale
No architectural ambiguity remains regarding how persistent entities relate to one another.

Part A Status
COMPLETE
Chapter 3 – Part A now provides a complete architectural blueprint for the Firestore persistence layer.
The Engineering Lead can establish the database structure and collection ownership without making additional architectural decisions.
Next Section: Chapter 3 – Part B: Document Schemas, Validation Rules & JSON Contracts

Yes. This is the right place to split it. Part B1 defines the three collections that drive almost the entire application (users, reports, and work_orders). Once these are frozen, the rest of the persistence layer naturally follows.

PROJECT_SPEC.md
Chapter 3 — Database Design & Firestore Specification
Part B1 — Core Document Schemas
Status: Implementation Specification
Architecture Status: LOCKED
Objective
Define the complete document schemas for the three primary operational collections:
users
reports
work_orders
These collections form the operational backbone of CityOps AI.
All field names, validation rules, constraints, and lifecycle expectations defined in this section are architecturally locked.

3.18 Schema Design Principles
All Firestore documents follow common design principles.
Common Metadata Fields
Every document SHALL contain:
Field
Type
Required
Description
id
String
✓
Unique document identifier
createdAt
Timestamp
✓
Creation timestamp
updatedAt
Timestamp
✓
Last modification timestamp


Naming Convention
camelCase for field names
lowercase collection names
immutable IDs
ISO timestamps
enums for lifecycle fields

Status Fields
Lifecycle values shall always use predefined enums.
Free-text lifecycle values are prohibited.

3.19 Collection: users
Purpose
Stores authenticated citizens and municipal authority users.
This collection contains identity and profile information only.
It never stores operational ticket data.

Schema
Field
Type
Required
Default
Validation
id
String
✓
—
Immutable
role
Enum
✓
citizen
citizen / authority
fullName
String
✓
—
2–100 characters
email
String
✓
—
Valid email
phone
String
✗
null
Optional
profilePhotoUrl
String
✗
null
Valid URL
isActive
Boolean
✓
true
—
createdAt
Timestamp
✓
Auto
Immutable
updatedAt
Timestamp
✓
Auto
Auto-updated


JSON Example
{
  "id": "USR_9F8A2D",
  "role": "citizen",
  "fullName": "Aarav Sharma",
  "email": "aarav@example.com",
  "phone": "+91XXXXXXXXXX",
  "profilePhotoUrl": null,
  "isActive": true,
  "createdAt": "2026-06-28T10:20:11Z",
  "updatedAt": "2026-06-28T10:20:11Z"
}


Validation Rules
Email must be unique.
Role cannot change without administrative action.
Deleted users should be soft-disabled (isActive = false) rather than removed.

Section 3.20 — reports
Schema
Ensure the field names are exactly:
Field
Type
Required
Default
Validation
id
String
✓
—
Immutable
userId
String
✓
—
Existing User
imageUrl
String
✓
—
Cloud Storage URL
location
GeoPoint
✓
—
Valid Coordinates
issueType
Enum
✓
—
Supported Categories
citizenDescription
String
✗
""
Maximum 500 Characters
status
Enum
✓
pending_confirmation
Valid Lifecycle
aiDecisionId
String
✓
—
Existing AI Decision
workOrderId
String
✓
—
Existing Work Order
createdAt
Timestamp
✓
Auto
Immutable
updatedAt
Timestamp
✓
Auto
Auto Updated

{
  "id": "REP_20260628_0001",
  "userId": "USR_9F8A2D",
  "imageUrl": "gs://cityops-ai/uploads/REP_20260628_0001.jpg",
  "location": {
    "latitude": 15.3921,
    "longitude": 73.8779
  },
  "issueType": "pothole",
  "citizenDescription": "Large pothole near the campus entrance.",
  "status": "pending_confirmation",
  "aiDecisionId": "AID_00192",
  "workOrderId": "WO_00381",
  "createdAt": "2026-06-28T10:25:30Z",
  "updatedAt": "2026-06-28T10:25:30Z"
}



Collection: work_orders
Collection: work_orders
Purpose
Represents the municipality-facing operational record.
This is the primary collection used by municipal authorities and serves as the operational source of truth for issue management.
To optimize dashboard performance, selected fields from the associated Report are intentionally denormalized into the Work Order. This eliminates additional Firestore reads for common authority workflows while preserving the Report as the authoritative citizen submission.
The Work Order is created immediately after AI processing and begins in:
pending_confirmation
After citizen confirmation it transitions to either:
active
needs_human_review
depending on the AI confidence evaluation.

Schema
Field
Type
Required
Default
Validation
id
String
✓
—
Immutable
reportId
String
✓
—
Existing Report
aiDecisionId
String
✓
—
Existing AI Decision
imageUrl
String
✓
—
Cloud Storage URL (Denormalized)
location
GeoPoint
✓
—
Valid coordinates (Denormalized)
thumbnailUrl
String
✗
null
Optional optimized dashboard image
issueType
Enum
✓
—
Supported issue categories
department
Enum
✓
—
Valid department
priority
Enum
✓
medium
low / medium / high / critical
severity
Enum
✓
medium
low / medium / high
status
Enum
✓
pending_confirmation
Valid lifecycle
confidence
Number
✓
—
0.0–1.0
mergeRecommended
Boolean
✓
false
—
assignedTo
String
✗
null
Authority User ID
recommendedAction
String
✓
—
Maximum 500 characters
createdAt
Timestamp
✓
Auto
Immutable
updatedAt
Timestamp
✓
Auto
Auto-updated


Denormalized Fields
The following fields are copied from the Report during Work Order creation:
imageUrl
location
thumbnailUrl (optional)
These values exist solely to optimize Authority Dashboard queries.
The Report remains the authoritative source for citizen submission data.

Department Values
road_maintenance
water_department
electrical_department
sanitation_department

Priority Values
low

medium

high

critical

Status Lifecycle
pending_confirmation

↓

active

↓

in_progress

↓

completed

↓

archived
or
pending_confirmation

↓

needs_human_review

↓

active

↓

in_progress

↓

completed

↓

archived

{
  "id": "WO_00381",
  "reportId": "REP_20260628_0001",
  "aiDecisionId": "AID_00192",
  "imageUrl": "gs://cityops-ai/uploads/REP_20260628_0001.jpg",
  "thumbnailUrl": "gs://cityops-ai/thumbnails/REP_20260628_0001.jpg",
  "location": {
    "latitude": 15.3921,
    "longitude": 73.8779
  },
  "issueType": "pothole",
  "department": "road_maintenance",
  "priority": "high",
  "severity": "high",
  "status": "active",
  "confidence": 0.94,
  "mergeRecommended": true,
  "assignedTo": null,
  "recommendedAction": "Repair using cold-mix asphalt within 24 hours.",
  "createdAt": "2026-06-28T10:25:31Z",
  "updatedAt": "2026-06-28T10:26:05Z"
}


Validation Rules
Every Work Order references exactly one Report.
Every Work Order references exactly one AI Decision.
location must contain valid latitude and longitude.
imageUrl must reference an existing Cloud Storage object.
confidence must remain within 0.0–1.0.
Only backend services may update lifecycle states.
Citizens cannot modify Work Orders.
Once archived, a Work Order becomes read-only.

3.22 Cross-Collection Invariants
The following constraints must always hold true:
Invariant
Description
INV-001
Every Report belongs to exactly one User.
INV-002
Every Report references exactly one AI Decision.
INV-003
Every Report references exactly one Work Order.
INV-004
Every Work Order references exactly one Report.
INV-005
Every Work Order references exactly one AI Decision.
INV-006
Report and Work Order IDs are immutable once created.
INV-007
AI-generated fields cannot be modified by frontend clients.

Violation of these invariants represents a persistence-layer defect.

Part B1 Status
Complete
This section fully specifies the three primary operational collections:
✓ users
✓ reports
✓ work_orders
Including:
Complete schemas
Field definitions
Data types
Required fields
Default values
Validation rules
Lifecycle constraints
JSON examples
Cross-collection invariants
The Engineering Lead can now implement the core Firestore collections without making additional schema decisions.
Next Section: Chapter 3 – Part B2: Supporting Collections (ai_decisions, audit_logs, embeddings, dashboard_metadata) & Global Validation Rules

Like Part B1, B2 is the second half of the schema specification. It defines every remaining collection and locks the global validation rules.

PROJECT_SPEC.md
Chapter 3 — Database Design & Firestore Specification
Part B2 — Supporting Collection Schemas & Global Validation
Status: Implementation Specification
Architecture Status: LOCKED
Objective
Define the schemas for the supporting Firestore collections and establish the global validation rules that apply across the persistence layer.
The collections covered are:
ai_decisions
audit_logs
embeddings
dashboard_metadata

Section 3.23 — ai_decisions
Schema
Replace the table with:
Field
Type
Required
Default
Validation
id
String
✓
—
Immutable
reportId
String
✓
—
Existing Report
perception
Map
✓
—
Valid Perception Object
toolHistory
Array<Object>
✓
[]
Ordered Tool Execution History
evidence
Map
✓
{}
Deterministic Tool Outputs
reasoning
String
✓
—
AI Generated Reasoning
confidence
Number
✓
—
0.0–1.0
verificationNotes
Array<String>
✓
[]
Verification Notes
finalDecision
Map
✓
—
Final Operational Recommendation
createdAt
Timestamp
✓
Auto
Immutable

Key fixes:
toolHistory default → [] (not 0)
verificationNotes default → [] (not 0)
Explicitly use Array<Object> and Array<String> for stronger typing.

{
  "id": "AID_00192",
  "reportId": "REP_20260628_0001",
  "perception": {
    "issueType": "pothole",
    "severity": "medium",
    "confidence": 0.82
  },
  "toolHistory": [
    {
      "tool": "NearbyReports",
      "status": "success"
    },
    {
      "tool": "RoadContext",
      "status": "success"
    }
  ],
  "evidence": {
    "nearbyReports": 2,
    "roadType": "arterial",
    "duplicateSimilarity": 0.91
  },
  "reasoning": "High traffic arterial road with two nearby reports. Severity increased.",
  "confidence": 0.94,
  "verificationNotes": [],
  "finalDecision": {
    "priority": "high",
    "department": "road_maintenance",
    "status": "verified"
  },
  "createdAt": "2026-06-28T10:25:30Z"
}

Section 3.24 — Collection: audit_logs
Collection: audit_logs
Schema
Field
Type
Required
Default
id
String
✓
—
workOrderId
String
✓
—
actorType
Enum
✓
system
actorId
String
✗
null
event
Enum
✓
—
previousState
String
✗
null
newState
String
✓
—
description
String
✓
—
createdAt
Timestamp
✓
Auto


{
  "id": "AUD_01092",
  "workOrderId": "WO_00381",
  "actorType": "authority",
  "actorId": "USR_001",
  "event": "completed",
  "previousState": "in_progress",
  "newState": "completed",
  "description": "Road repair completed.",
  "createdAt": "2026-06-28T17:30:00Z"
}


Validation Rules
Audit Logs are immutable.
Existing entries are never modified.
Existing entries are never deleted.
Every Work Order state transition generates exactly one Audit Log entry.
createdAt is immutable.

3.25 Collection: embeddings
Purpose
Stores multimodal embeddings used exclusively for duplicate detection.
These documents are operational artifacts and are never queried by the dashboard.

Schema
Field
Type
Required
Default
id
String
✓
—
reportId
String
✓
—
model
String
✓
—
embedding
Array
✓
—
createdAt
Timestamp
✓
Auto


JSON Example
{
  "id": "EMB_00932",
  "reportId": "REP_20260628_0001",
  "model": "multimodal-embedding-001",
  "embedding": [
    0.018,
    -0.203,
    0.447
  ],
  "createdAt": "2026-06-28T10:25:32Z"
}


Validation Rules
Generated exactly once.
Never updated.
Deleted when associated report is permanently removed.
Accessible only by backend services.

Section 3.26 — Collection: dashboard_metadata
Collection: dashboard_metadata
Schema
Field
Type
Required
Default
id
String
✓
—
activeCount
Number
✓
0
reviewCount
Number
✓
0
completedToday
Number
✓
0
departmentSummary
Map
✓
{}
updatedAt
Timestamp
✓
Auto


{
  "id": "GLOBAL",
  "activeCount": 21,
  "reviewCount": 4,
  "completedToday": 8,
  "departmentSummary": {
    "road_maintenance": 7,
    "water_department": 5,
    "electrical_department": 3,
    "sanitation_department": 6
  },
  "updatedAt": "2026-06-28T17:45:00Z"
}


Validation Rules
Dashboard Metadata is derived from Work Orders.
It is never manually edited.
It can always be regenerated from operational records.
Loss of this collection must never affect system correctness.
updatedAt reflects the most recent aggregation refresh.

3.27 Global Validation Rules
The following rules apply across every Firestore collection.

Identifier Rules
IDs are immutable.
IDs are globally unique within their collection.
IDs never encode business state.

Timestamp Rules
Every mutable document SHALL contain:
createdAt
updatedAt
Immutable collections require only:
createdAt

Enum Validation
All enum fields must match predefined values.
Unknown enum values are rejected.

Reference Validation
Every referenced document must exist before persistence.
Examples:
reportId
userId
workOrderId
aiDecisionId

Confidence Validation
Confidence values must satisfy:
0.0 ≤ confidence ≤ 1.0


AI Ownership Rules
Only backend AI services may create AI Decision documents.
Frontend clients may never create or modify AI-generated fields.

Lifecycle Validation
Status transitions must follow the lifecycle defined in Chapter 2.
Invalid transitions are rejected.

Section 3.27 — Global Validation Rules
Add the following rule under Reference Validation:
Denormalized Field Validation
The following fields in the work_orders collection are controlled denormalized fields:
imageUrl
location
thumbnailUrl
These values are copied from the associated Report during Work Order creation.
The backend is responsible for maintaining consistency.
The Report remains the canonical source of these fields.

3.28 Naming Standards
Collections
lowercase
plural nouns
Examples:
users
reports
work_orders
audit_logs


Documents
Uppercase prefixes followed by unique identifiers.
Examples:
USR_0001
REP_0001
WO_0001
AID_0001
AUD_0001
EMB_0001


Fields
camelCase
descriptive names
no abbreviations unless standardized

3.29 Schema Invariants
The following rules must always remain true.
ID
Invariant
INV-008
AI Decision documents are immutable.
INV-009
Audit Logs are append-only.
INV-010
Embeddings belong to exactly one Report.
INV-011
Dashboard Metadata is derived only from Work Orders.
INV-012
Every Work Order references one Report and one AI Decision.
INV-013
AI-generated fields are never editable by frontend clients.

Violation of these invariants constitutes a persistence-layer defect.

Part B2 Status
Complete
This section fully specifies the remaining Firestore collections:
✓ ai_decisions
✓ audit_logs
✓ embeddings
✓ dashboard_metadata
It also defines:
✓ Global validation rules
✓ Naming standards
✓ Cross-schema invariants
Together, Part B1 and Part B2 provide a complete, implementation-ready Firestore schema specification.
Next Section: Chapter 3 – Part C: Query Design, Composite Indexes & Cloud Storage Specification

PROJECT_SPEC.md
Chapter 3 — Database Design & Firestore Specification
Part C1.1 — Firestore Query Design (Citizen & Core Queries)
Status: Implementation Specification
Architecture Status: LOCKED
Objective
This section defines how Firestore is queried throughout CityOps AI. Rather than documenting individual API endpoints, it specifies the database access patterns required to support the runtime architecture defined in Chapters 1 and 2.
The query layer is optimized around the following principles:
Minimize Firestore document reads
Avoid collection scans
Favor indexed queries
Keep dashboard latency predictable
Maintain backend ownership of all database operations
No implementation-specific code is defined in this chapter.

3.30 Firestore Query Design Philosophy
Firestore is a document database optimized for indexed lookups rather than relational joins.
Accordingly, CityOps AI adopts a query-first schema design, where document structure is shaped by expected read patterns rather than normalization.
The system is heavily read-oriented.
Typical usage includes:
Citizens checking report status
Authorities viewing active work orders
AI services retrieving contextual evidence
Dashboard summaries
The schema therefore favors:
Single-document retrieval
Indexed filtering
Controlled denormalization
Minimal cross-collection reads

3.31 Query Design Principles
Principle QD-001 — No Collection Scans
Every operational query shall execute using indexed fields.
Full collection scans are prohibited except for administrative maintenance tasks.

Principle QD-002 — Single Responsibility Queries
Each query should answer one business question.
Examples:
Retrieve one Report
Retrieve active Work Orders
Retrieve AI Decision
Retrieve Audit History
Queries should not attempt to reconstruct business entities through multiple sequential lookups unless unavoidable.

Principle QD-003 — Backend Ownership
Frontend applications never query Firestore directly for operational collections.
All queries originate through backend services.
This ensures:
Authentication
Authorization
Validation
Auditability

Principle QD-004 — Read Optimization
Frequently displayed data is intentionally denormalized to reduce Firestore reads.
Example:
Authority Dashboard requires:
location
imageUrl
priority
status
These fields are stored directly inside the Work Order.
Therefore:
Dashboard

↓

Read Work Order

↓

Render

instead of
Dashboard

↓

Read Work Order

↓

Read Report

↓

Render


Principle QD-005 — Immutable History
Historical collections (ai_decisions, audit_logs) are append-only.
Queries against these collections are read-only.
No update queries target historical documents.

3.32 Primary Query Catalogue
The following table defines every major query category within the system.
Query Category
Primary Collection
Consumer
Citizen Report Status
reports
Citizen Application
Citizen Report Details
reports
Citizen Application
Authority Active Issues
work_orders
Authority Dashboard
Human Review Queue
work_orders
Authority Dashboard
Completed Issues
work_orders
Authority Dashboard
AI Decision Details
ai_decisions
Backend / Dashboard
Audit History
audit_logs
Authority Dashboard
Duplicate Detection
embeddings
AI Orchestrator
Dashboard Statistics
dashboard_metadata
Authority Dashboard

Each query category is implementation-mandatory.

3.33 Citizen Query Specifications
The Citizen Application performs a small number of predictable queries.
All queries are scoped to the authenticated user.

CQ-001 — Retrieve Report Status
Purpose
Display the latest lifecycle state of a citizen's submitted report.
Collection
reports
Filters
userId
reportId
Expected Result
One Report document.
Returned Information
issueType
status
createdAt
updatedAt
Performance Target
Single document lookup.
No additional collection reads.

CQ-002 — Retrieve Report Details
Purpose
Display the complete report information after submission.
Collection
reports
Filters
reportId
userId
Expected Result
One Report.
Returned Information
issueType
citizenDescription
imageUrl
location
status
createdAt

CQ-003 — Retrieve AI Resolution Summary
Purpose
Display the AI-generated Resolution Summary immediately after analysis.
Collections
reports
ai_decisions
Query Pattern
Retrieve Report using reportId.
Retrieve associated AI Decision using aiDecisionId.
Returned Information
From Report:
issueType
imageUrl
location
From AI Decision:
reasoning
confidence
finalDecision
verificationNotes
This query is executed only once during the confirmation workflow.
It is not part of normal dashboard usage.

CQ-004 — Retrieve Citizen Report History
Purpose
Display previously submitted reports.
Collection
reports
Filters
userId
Ordering
Descending by createdAt.
Pagination
Cursor-based pagination.
Page Size
20 reports per request.
Returned Information
issueType
status
createdAt
thumbnail (derived from imageUrl)
reportId

CQ-005 — Refresh Report Status
Purpose
Allow citizens to view updated progress without reloading the application.
Collection
reports
Filters
reportId
Returned Information
Only mutable fields:
status
updatedAt
This lightweight query avoids reloading static report information.

3.34 Citizen Read Patterns
Citizen operations are intentionally lightweight.
Typical lifecycle:
Upload Report

↓

Read Resolution Summary

↓

Confirm Submission

↓

Occasionally Check Status

↓

View History

Expected Firestore reads per citizen session:
Operation
Reads
Upload workflow
2–3
Confirmation
1
Status refresh
1
History page
1

This predictable access pattern keeps Firestore costs low while maintaining responsive user interactions.

Part C1.1 Status
This section defines:
✓ Firestore query philosophy
✓ Query design principles
✓ Primary query catalogue
✓ Citizen query specifications
✓ Citizen read patterns
These specifications establish how citizen-facing features interact with Firestore while remaining fully consistent with the locked architecture.
Next Section: Chapter 3 – Part C1.2: Authority Queries, AI Queries, Composite Indexes & Query Optimization

PROJECT_SPEC.md
Chapter 3 — Database Design & Firestore Specification
Part C1.2 — Authority Queries, AI Queries & Query Optimization
Status: Implementation Specification
Architecture Status: LOCKED
Objective
This section defines all Firestore queries required by the Authority Dashboard and AI Orchestrator, along with the indexing strategy, expected read/write patterns, and query optimization guidelines.
These query specifications are mandatory implementation contracts.

3.35 Authority Query Specifications
The Authority Dashboard is the highest-volume consumer of Firestore reads.
Unlike the Citizen Application, it continuously monitors operational data and requires efficient, indexed queries.
All Authority queries operate on the work_orders collection.

AQ-001 — Retrieve Active Work Orders
Purpose
Display all currently active municipal issues.
Collection
work_orders
Filters
status = active
Ordering
priority (Descending)
createdAt (Descending)
Returned Fields
workOrderId
issueType
imageUrl
thumbnailUrl
location
department
priority
confidence
status
Performance Target
Single indexed query.
No joins.

AQ-002 — Retrieve Human Review Queue
Purpose
Display work orders requiring manual verification.
Collection
work_orders
Filters
status = needs_human_review
Ordering
confidence (Ascending)
createdAt (Ascending)
Lower-confidence reports should appear first.

AQ-003 — Retrieve Department Queue
Purpose
Display work orders assigned to a specific department.
Filters
department
status
Ordering
priority
createdAt

AQ-004 — Retrieve Completed Work Orders
Purpose
Display historical completed issues.
Filters
status = completed
Ordering
updatedAt (Descending)
Pagination
Cursor-based pagination.

AQ-005 — Retrieve Single Work Order
Purpose
Open the complete issue details page.
Filter
workOrderId
Returned Information
Entire Work Order document.
Additional details (AI reasoning, audit history) are retrieved through separate backend services.

Replacement: 3.36 AI & Internal Query Specifications
IQ-003 — Retrieve Similar Embeddings
Collection
embeddings
Query Pattern
Use Firestore Native Vector Search (findNearest) with cosine distance.
Pre-filter
Candidate reports are first identified through the geospatial search performed by the AI Decision Engine.
Only embeddings belonging to those candidate reports are considered during vector search.
Purpose
Retrieve the closest semantic matches to support duplicate detection.
The backend MUST use Firestore's native vector search capability rather than loading embedding vectors into application memory for manual similarity calculations.
This ensures:
Scalable duplicate detection
Low backend memory usage
Consistent latency
Native Firestore optimization
The resulting similarity scores are passed to the AI Decision Engine as deterministic evidence during the Evidence-Driven Decision Loop.

Replacement: 3.37 Composite Index Specification
IDX-003
Collection
work_orders
Fields
department ASC

status ASC

priority DESC

createdAt DESC

Used By
AQ-003 — Retrieve Department Queue
Purpose
Supports efficient retrieval of department-specific work queues while maintaining the required ordering by operational priority and recency.
This index satisfies the sorting requirements defined in AQ-003 and prevents Firestore runtime index errors.


3.38 Read / Write Patterns
The persistence layer is intentionally read-heavy.
Approximate operational ratio:
Reads : Writes

≈ 8 : 1


Citizen Workflow
Operation
Reads
Writes
Upload
2
3
Confirmation
1
2
Status Refresh
1
0
History
1
0


Authority Dashboard
Operation
Reads
Writes
Dashboard Load
1
0
Open Ticket
2
0
Update Status
1
1
Human Review
2
1


AI Processing
Stage
Reads
Writes
Report Creation
0
1
AI Decision
0
1
Embedding Storage
0
1
Work Order Creation
0
1
Duplicate Detection
2–5
0


3.39 Query Optimization Strategy
The persistence layer follows the optimization principles below.

Optimization 1 — Single Query Dashboard
The Authority Dashboard should render from a single query to work_orders.
No additional Report lookups should be required.

Optimization 2 — Denormalized Display Fields
Frequently displayed fields are duplicated into Work Orders.
Examples:
imageUrl
thumbnailUrl
location
This minimizes Firestore reads.

Optimization 3 — Cursor Pagination
Offset pagination is prohibited.
All paginated queries use Firestore cursors.
Benefits:
Stable performance
Lower read costs
Better scalability

Optimization 4 — Immutable Collections
Collections such as:
ai_decisions
audit_logs
embeddings
are append-only.
No update queries target these collections.

Optimization 5 — Small Documents
Operational documents should remain compact.
Large AI reasoning histories remain inside ai_decisions.
Large embeddings remain inside embeddings.
This prevents oversized dashboard payloads.

Optimization 6 — Backend Query Ownership
Every Firestore query is executed by backend services.
Clients never perform unrestricted Firestore queries.
This ensures:
Security
Validation
Consistent business logic
Auditability

3.40 Part C1 Completion Summary
This section defines:
✓ Authority Dashboard queries
✓ AI internal queries
✓ Composite indexes
✓ Read/write patterns
✓ Query optimization strategy
✓ Backend query ownership
The Engineering Lead now has a complete specification for implementing efficient Firestore query patterns consistent with the locked architecture.

Part C1 Status
COMPLETE
The complete Firestore query layer is now specified.
No additional database query design decisions are required before implementation.
Next Section: Chapter 3 – Part C2: Cloud Storage Design, Embedding Storage Strategy & Data Lifecycle

PROJECT_SPEC.md
Chapter 3 — Database Design & Firestore Specification
Part C2 — Cloud Storage Design, Embedding Strategy & Data Lifecycle
Status: Implementation Specification
Architecture Status: LOCKED
Objective
This section defines the non-Firestore persistence layer, including Cloud Storage organization, embedding management, duplicate detection storage, data lifecycle, cleanup policies, and storage engineering guidelines.
This chapter complements the Firestore specification and completes the persistence architecture.

3.41 Cloud Storage Design
Purpose
Google Cloud Storage is the system of record for all uploaded images.
Firestore stores only metadata and references (imageUrl, thumbnailUrl).
Binary files are never stored inside Firestore.

Storage Responsibilities
Cloud Storage is responsible for:
Original citizen uploads
Optimized thumbnails
Future archival copies (if required)
Cloud Storage is not responsible for:
AI metadata
Operational state
Dashboard statistics

Storage Architecture
Citizen Upload
        │
        ▼
Cloud Storage
        │
        ├──────────────┐
        │              │
        ▼              ▼
 Original Image    Thumbnail
        │              │
        └──────┬───────┘
               │
               ▼
Firestore stores only URLs


3.42 Bucket Organization
A single Cloud Storage bucket is used.
cityops-ai-storage/

    uploads/
        2026/
            06/
                REP_000001.jpg

    thumbnails/
        2026/
            06/
                REP_000001.jpg

    archive/
        2026/
            06/

Folders are logical prefixes.
No nested application logic depends on folder hierarchy.

3.43 Naming Convention
Original image
uploads/YYYY/MM/REPORT_ID.jpg

Example
uploads/2026/06/REP_000001.jpg

Thumbnail
thumbnails/YYYY/MM/REPORT_ID.jpg

Archived copy
archive/YYYY/MM/REPORT_ID.jpg


3.44 Image Metadata
Every uploaded image should include metadata.
Metadata
Purpose
reportId
Link to Firestore
uploadedBy
User reference
uploadedAt
Upload timestamp
contentType
MIME validation
fileSize
Monitoring
checksum
Integrity validation

Metadata improves traceability without requiring additional Firestore reads.

3.45 Storage Lifecycle
Citizen Upload

↓

Cloud Storage

↓

AI Processing

↓

Citizen Confirmation

↓

Operational Usage

↓

Completed

↓

Archive

↓

Retention Expiry

↓

Deletion

Images remain available throughout the operational lifecycle.
Deletion occurs only after retention policies expire.

3.46 Thumbnail Strategy
The Authority Dashboard does not load original images by default.
Instead:
Dashboard

↓

thumbnailUrl

↓

Full image (on demand)

Benefits:
Faster dashboard loading
Lower bandwidth
Better UX
Lower rendering latency
The original image is fetched only when a work order is opened.

3.47 Embedding Storage Strategy
Embeddings are stored in the dedicated embeddings collection.
They are intentionally isolated from Reports and Work Orders.
Reasons:
Large vectors
Rarely queried
Dashboard never needs them
Prevent oversized operational documents

Embedding Relationship
Report

↓

Embedding

↓

Duplicate Detection

Each Report owns exactly one embedding.

3.48 Duplicate Detection Workflow
Duplicate detection follows a deterministic pipeline.
New Report

↓

Geo Search

↓

Candidate Reports

↓

Embedding Similarity

↓

Similarity Score

↓

AI Decision Engine

↓

Merge Recommendation

The AI never performs unrestricted duplicate searches.
Instead:
Firestore identifies nearby candidates.
Embedding similarity narrows candidates.
The AI receives validated evidence.
This architecture prevents AI hallucinations while maintaining explainability.

3.49 Embedding Lifecycle
Image Uploaded

↓

Embedding Generated

↓

Stored

↓

Used During Duplicate Detection

↓

Retained

↓

Deleted With Report

Embeddings are immutable.
They are regenerated only if the underlying image is replaced (which is not part of the current architecture).

Replacement: 3.50 Storage Cleanup Policy
Cleanup is handled automatically wherever possible to minimize backend complexity and operational cost.
Resources Eligible for Cleanup
Draft Reports remaining in pending_confirmation
Draft Work Orders remaining in pending_confirmation
Associated AI Decision documents for expired drafts
Orphaned thumbnails
Archived images that exceed their retention period
Cleanup Mechanisms
Firestore TTL
Draft operational documents SHALL use Firestore Time-To-Live (TTL) policies.
Documents that remain in the pending_confirmation state for more than 24 hours are automatically removed by Firestore.
TTL applies to:
Reports
Work Orders
Associated temporary AI Decision records
This eliminates the need for custom backend cleanup logic for abandoned submissions.
Cloud Storage Cleanup
Cloud Storage objects cannot be removed using Firestore TTL.
Instead, lightweight scheduled backend maintenance jobs periodically reconcile Cloud Storage with Firestore and remove:
Images belonging to expired draft reports
Orphaned thumbnails
Archived images beyond the configured retention period
Cleanup Order
To preserve consistency, cleanup follows the sequence below:
Firestore TTL expires draft document
        │
        ▼
Scheduled Storage Reconciliation
        │
        ▼
Delete orphaned images
        │
        ▼
Delete orphaned thumbnails

The frontend never performs cleanup operations.
All cleanup is managed through backend infrastructure.


3.51 Data Lifecycle
The complete persistence lifecycle is shown below.
Citizen Upload
        │
        ▼
Cloud Storage
        │
        ▼
Draft Report
(status = pending_confirmation)
        │
        ▼
AI Decision
        │
        ▼
Embedding Generated
        │
        ▼
Draft Work Order
        │
        ▼
Citizen Confirmation
        │
        ▼
Work Order Activated
        │
        ▼
Authority Processing
        │
        ▼
Completed
        │
        ▼
Archived
        │
        ▼
Retention Expiry
        │
        ▼
Cleanup

This lifecycle is deterministic.
No stage bypasses persistence.

3.52 Engineering Notes
Storage Separation
Binary files belong in Cloud Storage.
Structured metadata belongs in Firestore.

Immutable Assets
Original uploaded images should not be modified after upload.
Any transformations produce new storage objects (for example, thumbnails).

Cleanup Safety
Deletion order:
Firestore references removed.
Storage objects deleted.
Embeddings removed.
This prevents dangling references.

Backend Ownership
Only backend services:
upload images
generate thumbnails
generate embeddings
delete storage objects
Clients never manipulate Cloud Storage directly.

3.53 Part C2 Completion Summary
This section defines:
✓ Cloud Storage architecture
✓ Bucket organization
✓ Storage naming conventions
✓ Image metadata
✓ Thumbnail strategy
✓ Embedding storage
✓ Duplicate detection workflow
✓ Data lifecycle
✓ Cleanup policies
✓ Storage engineering principles

Chapter 3 Completion Checklist
✓ Database philosophy defined
✓ Firestore collections defined
✓ Document schemas complete
✓ Collection relationships documented
✓ Firestore queries specified
✓ Composite indexes identified
✓ Cloud Storage architecture defined
✓ Embedding strategy documented
✓ Security responsibilities defined
✓ Data lifecycle documented
✓ Failure handling specified
✓ Naming conventions locked
✓ Engineering constraints documented
✓ Persistence architecture implementation-ready

━━━━━━━━━━━━━━━━━━━━━━
Chapter Status
COMPLETE
Dependencies
Chapter 1 — Product Definition
Chapter 2 — System Architecture
Implementation Readiness
READY
The Engineering Lead can implement the complete persistence layer without making additional architectural decisions.
Open Questions
None.
The persistence architecture is fully locked.
Ready for Technical Review
YES
Next Chapter
Chapter 4 — API Specification & Backend Contracts
━━━━━━━━━━━━━━━━━━━━━━

I'll keep this as a proper engineering specification in the same style as the previous chapters.
PROJECT_SPEC.md
Chapter 3 — Database Design & Firestore Specification
Part D — Security & Lifecycle
Status: Implementation Specification
Architecture Status: LOCKED

3.54 Security Model
3.54.1 Security Philosophy
CityOps AI follows a Zero Trust security model.
No client request is trusted by default.
Every request must be:
Authenticated
Authorized
Validated
Audited
The frontend is considered an untrusted environment.
Business rules are enforced exclusively by backend services.

3.54.2 Trust Boundaries
Citizen Device
      │
      │ (Untrusted)
      ▼
Frontend Application
      │
      │ HTTPS
      ▼
Backend API (Trusted Boundary)
      │
 ┌────┴─────────────┐
 │                  │
 ▼                  ▼
Gemini APIs     Google Cloud
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
      Firestore         Cloud Storage

Only the backend communicates with Firestore, Cloud Storage and Gemini.
Direct client access to operational data is prohibited.

3.54.3 Authentication Assumptions
The system assumes:
Every citizen is authenticated.
Every authority user is authenticated.
Anonymous uploads are not supported.
Authentication occurs before any operational request reaches backend services.
Authentication identity becomes the source of:
ownership
permissions
audit logging

3.54.4 Authorization Model
Authorization is role-based.
Supported roles:
Citizen
Authority
System Services
Permissions are determined entirely by backend services.
Clients never decide authorization.

3.54.5 Least Privilege Principle
Every component receives the minimum permissions required.
Examples:
Citizen
create report
read own reports
Cannot:
modify AI decisions
modify work orders
access other users' reports
Authority
manage work orders
resolve issues
review low-confidence cases
Cannot:
modify AI history
alter audit logs
AI Services
create AI Decisions
create Work Orders
Cannot:
modify completed reports
rewrite historical AI decisions

3.54.6 Separation of Responsibilities
Citizen

↓

Reports

↓

AI

↓

Work Orders

↓

Authority

↓

Resolution

Citizens never directly modify municipal operational data.
Authorities never modify citizen submissions.

Replacement — Section 3.55 Firestore Security Responsibilities
reports
Citizen
Read
Read only their own reports through authenticated backend APIs (or an equivalent secured access layer).
Create
PROHIBITED
Update
PROHIBITED
Citizens never write directly to the reports collection.
Report creation, updates, and lifecycle transitions are performed exclusively by backend services after authentication, validation, AI processing, and citizen confirmation.
Citizens also cannot modify:
AI-generated classifications
AI confidence
Work Order references
Report lifecycle state

Authority
Read
Read reports required for municipal operations.
Write
Not permitted.
Authorities never modify the original citizen report.

System (Backend)
The backend exclusively owns all write operations.
Responsibilities include:
Create draft reports
Activate confirmed reports
Update lifecycle state
Maintain Report ↔ Work Order consistency
Maintain Report ↔ AI Decision consistency
This section enforces SEC-001:
Clients never write directly to operational Firestore collections.

3.56 Cloud Storage Security
Images are private assets.
Uploads occur only through authenticated backend endpoints.
Cloud Storage never exposes public buckets.
Image retrieval uses signed URLs generated by backend services.
Metadata is protected.
Citizens cannot modify storage metadata after upload.
Only backend services may:
upload
delete
generate thumbnails
generate signed URLs
Cleanup follows the lifecycle defined in Part C.

3.57 Complete Data Lifecycle
Citizen Upload
        │
        ▼
Image Stored
        │
        ▼
AI Processing
        │
        ▼
Evidence Gathering
        │
        ▼
Resolution Summary
        │
        ▼
Citizen Confirmation
        │
        ▼
Draft Report → Active Report
        │
        ▼
Work Order Activated
        │
        ▼
Authority Dashboard
        │
        ▼
Status Updates
        │
        ▼
Completed
        │
        ▼
Archived

Lifecycle Transitions
Upload → Image Stored
Image is persisted in Cloud Storage.
No operational decision has been made.

Image Stored → AI Processing
The AI Decision Engine performs visual understanding and evidence gathering.

AI Processing → Resolution Summary
A structured AI recommendation is generated.
No municipal action has started.

Resolution Summary → Citizen Confirmation
The citizen reviews the AI-generated report.
If abandoned, the draft expires through Firestore TTL.

Citizen Confirmation → Active Report
The report becomes operational.
The corresponding Work Order becomes visible to authorities.

Authority Processing
Authorities update status as work progresses.
AI history remains immutable.

Completion
The issue is marked resolved.
Historical records remain available for auditing.

3.58 State Transitions
Supported lifecycle states:
pending_confirmation
active
needs_human_review
in_progress
completed
archived

Allowed State Diagram
                pending_confirmation
                          │
            ┌─────────────┴─────────────┐
            │                           │
            ▼                           ▼
         active                needs_human_review
            │                           │
            └─────────────┬─────────────┘
                          ▼
                    in_progress
                          │
                          ▼
                     completed
                          │
                          ▼
                      archived


Invalid Transitions
Not allowed:
completed → active
archived → active
pending_confirmation → completed
completed → pending_confirmation
archived → in_progress
These transitions violate lifecycle integrity.

Ownership
State
Owner
pending_confirmation
Citizen + Backend
active
Backend
needs_human_review
Authority
in_progress
Authority
completed
Authority
archived
System


3.59 Failure Handling
Upload Failure
Image upload fails.
Result:
No Report created.
User retries upload.

Gemini Failure
AI processing unavailable.
Result:
No operational records created.
Citizen receives retry option.

Firestore Failure
Cloud Storage upload succeeded.
Firestore write failed.
Result:
Operation retried.
No partial activation.

Cloud Storage Failure
Upload fails.
Pipeline terminates.
Nothing is persisted.

Maps API Failure
Pipeline continues.
Road metadata unavailable.
Confidence decreases.
Possible Human Review.

Duplicate Writes
Every report uses immutable IDs.
Duplicate requests become idempotent updates.

Partial Writes
Multi-document operations execute atomically wherever required.
No Work Order exists without its Report.

Network Interruptions
Interrupted uploads may be retried safely.
No duplicate operational records are created.

Replacement — Section 3.60 Reliability Principles
Transaction Boundaries
The following documents represent a single operational unit and must remain consistent:
Draft Report
AI Decision
Draft Work Order
These documents SHALL be created atomically using a single Firestore Batched Write.
The batched operation must either:
commit successfully for every document, or
fail completely.
Partial creation of operational records is prohibited.
This guarantees:
no orphan Reports
no orphan AI Decisions
no orphan Work Orders

Idempotency
All write operations shall be idempotent.
Repeated client requests for the same upload must never create duplicate operational records.
Duplicate uploads referencing the same request identifier shall resolve to the existing draft rather than creating a new Report or Work Order.

Consistency Guarantees
The persistence layer guarantees strong consistency for:
operational lifecycle state
Work Order status
Authority actions
Report ↔ AI Decision mapping
Report ↔ Work Order mapping
Historical collections remain immutable.

Recovery Strategy
Recoverable Failures
The backend may perform a single retry for transient infrastructure failures only.
Examples include:
temporary Firestore write failures
temporary network interruptions
interrupted Cloud Storage uploads
Maximum retries:
Firestore: 1
Cloud Storage: 1

Non-Recoverable Failures
The following operations must never be retried automatically:
Gemini Vision inference
AI Orchestrator reasoning
Tool execution after AI reasoning has begun
Automatic AI retries are prohibited because they:
violate the latency budget defined in Chapter 2,
increase operational cost,
introduce non-deterministic AI outputs,
risk cascading execution loops.
Instead, the system shall:
preserve the degraded execution state,
reduce confidence where appropriate,
transition to Needs Human Review when confidence falls below the configured threshold,
or return a safe, user-facing error if no operational record can be created.
This behavior remains fully consistent with the bounded AI Decision Engine defined in Chapter 2.

3.61 Engineering Constraints
The following invariants are mandatory.
SEC-001
Clients never write directly to operational collections.

SEC-002
AI Decisions are immutable.

SEC-003
Audit Logs are append-only.

SEC-004
Embeddings are immutable.

SEC-005
Authority users never modify citizen submissions.

SEC-006
Citizens never modify Work Orders.

SEC-007
Every Work Order references exactly one Report.

SEC-008
Every AI Decision references exactly one Report.

SEC-009
Completed operational records are never deleted through application workflows.

SEC-010
All lifecycle transitions must follow the approved state machine.

━━━━━━━━━━━━━━━━━━━━━━
Part D Status
COMPLETE
Dependencies
Chapter 1 — Product Definition
Chapter 2 — System Architecture
Chapter 3 Parts A–C
Implementation Readiness
READY
A backend engineer can now implement authentication, authorization, storage security, lifecycle management, failure recovery, and reliability policies without making additional architectural decisions.
Open Questions
None.
Ready for Technical Review
YES
Next Part
Part E – Engineering & Performance
━━━━━━━━━━━━━━━━━━━━━━

PROJECT_SPEC.md
Chapter 3 — Database Design & Firestore Specification
Part E — Engineering & Performance
Status: Implementation Specification
Architecture Status: LOCKED

3.62 Performance Considerations
The persistence layer is designed to optimize read performance, maintain predictable latency, and scale horizontally using Firestore's document-oriented architecture.
3.62.1 Expected Read Patterns
The system is read-dominant.
Approximate operational ratio:
Reads : Writes

≈ 8 : 1

Typical read consumers:
Consumer
Read Frequency
Authority Dashboard
Very High
Citizen Status Checks
Medium
AI Decision Engine
Medium
Dashboard Metadata
High
Audit History
Low


3.62.2 Expected Write Patterns
Writes primarily occur during:
Report creation
AI Decision creation
Work Order creation
Authority status updates
Audit logging
Historical collections remain append-only.

3.62.3 Concurrent Operations
Expected concurrent activities:
Citizen Upload
        │
        ▼
AI Decision Engine
        │
        ▼
Firestore Batched Write
        │
        ├───────────────┐
        ▼               ▼
Dashboard Update   Audit Logging

Concurrent operations must never violate transactional consistency.

3.62.4 Hotspot Prevention
To prevent Firestore hotspotting:
IDs use randomized prefixes or generated identifiers.
Documents are never created using sequential numeric IDs.
Storage paths are partitioned by year and month.
Frequently updated counters are isolated in dashboard_metadata.

3.62.5 Large Collection Growth
Expected long-term growth:
Collection
Growth Pattern
reports
Continuous
work_orders
Continuous
ai_decisions
Continuous
audit_logs
High
embeddings
Continuous

Growth assumptions:
Millions of reports remain manageable through indexed lookups.
Historical collections are never scanned.
Pagination is mandatory.

3.62.6 Pagination Strategy
Offset pagination is prohibited.
All collections supporting list views must use Firestore cursor-based pagination.
Benefits:
Constant query performance
Lower read costs
Better scalability

3.62.7 Query Optimization
Optimization principles:
Single collection reads whenever possible
Controlled denormalization
Immutable historical records
Composite indexes for every filtered query
Native vector search for embeddings
Backend-owned query execution

3.63 Cost Optimization
The persistence layer minimizes operational cost through careful data organization and query planning.

3.63.1 Firestore Read Optimization
Read costs are minimized through:
Denormalized Work Orders
Dashboard metadata aggregation
Indexed queries
Cursor pagination
Avoid:
N+1 document reads
Collection scans
Runtime joins

3.63.2 Firestore Write Optimization
Write costs are minimized by:
Firestore Batched Writes
Immutable historical collections
Minimal document updates
Avoiding redundant writes

3.63.3 Storage Optimization
Only image references are stored in Firestore.
Large binary assets remain in Cloud Storage.
Dashboard loads thumbnails by default.
Original images are fetched only when required.

3.63.4 Image Lifecycle Optimization
Original Upload
        │
        ▼
Thumbnail Generated
        │
        ▼
Operational Usage
        │
        ▼
Archive
        │
        ▼
Retention Expiry
        │
        ▼
Cleanup

Draft assets are automatically removed through Firestore TTL coordination and scheduled Cloud Storage cleanup.

3.63.5 Embedding Optimization
Embedding vectors:
Stored independently
Generated once
Reused for duplicate detection
Never loaded by dashboard queries
Duplicate searches use:
Firestore Native Vector Search
Geospatial pre-filtering

3.63.6 API Usage Optimization
The AI Decision Engine minimizes external API usage through:
Single visual understanding pass
Evidence-driven tool selection
Maximum of three tool invocations
No automatic Gemini retries

3.63.7 Cache Opportunities
The architecture avoids introducing dedicated caching infrastructure for the MVP.
Natural cache opportunities include:
Dashboard metadata
Department SLA lookups
Static configuration values
Caching must never become the primary source of truth.

3.64 Engineering Constraints
The following engineering constraints are mandatory.

Document Size
Operational documents should remain well below Firestore's maximum document size.
Large payloads (embeddings, audit history, AI reasoning) remain isolated in dedicated collections.

Collection Growth
Collections are expected to grow indefinitely.
No implementation may assume bounded collection size.

Consistency Guarantees
The following relationships must remain strongly consistent:
Report ↔ AI Decision
Report ↔ Work Order
Work Order ↔ Audit Log

Performance Targets
Metric
Target
Single document read
< 100 ms
Dashboard query
< 300 ms
Firestore write
< 200 ms
AI persistence transaction
< 500 ms
End-to-end upload pipeline
< 8 seconds


Scalability Assumptions
The architecture assumes:
Firestore horizontal scaling
Cloud Storage scalability
Stateless backend services
Increasing report volume without schema redesign

3.65 Naming Conventions
Consistency is mandatory across all persistence components.

Collections
Lowercase with underscores.
Examples:
users
reports
work_orders
ai_decisions
embeddings
audit_logs
dashboard_metadata


Document IDs
Uppercase prefix followed by generated identifier.
Examples:
USR_8A4D21
REP_000184
WO_003481
AID_000281
AUD_010483
EMB_000184


Field Names
Use camelCase.
Examples:
userId
reportId
workOrderId
imageUrl
thumbnailUrl
createdAt
updatedAt
citizenDescription
verificationNotes


Storage Paths
uploads/YYYY/MM/REPORT_ID.jpg

thumbnails/YYYY/MM/REPORT_ID.jpg

archive/YYYY/MM/REPORT_ID.jpg


Timestamp Fields
Only two timestamp field names are permitted:
createdAt

updatedAt


Status Values
Standard lifecycle values:
pending_confirmation

active

needs_human_review

in_progress

completed

archived


Enum Values
Enums must remain centralized and consistent across all collections.
Examples:
Issue Types:
pothole
water_leakage
broken_streetlight
garbage_accumulation
road_damage
Departments:
road_maintenance
water_department
electrical_department
sanitation_department

3.66 Firestore Best Practices
The persistence layer follows the following principles.

Query-First Design
Schema design follows expected query patterns.

Controlled Denormalization
Frequently displayed data is duplicated intentionally to minimize reads.

Immutable History
Historical records are append-only.

Backend Ownership
Operational collections are modified exclusively through backend services.

Native Firestore Features
The design intentionally leverages:
Batched Writes
Composite Indexes
Native Vector Search
TTL Policies
Cursor Pagination
These features reduce implementation complexity while improving scalability.

3.67 Implementation Sequence
Recommended implementation order:
Step 1
Firestore Initialization
        │
        ▼
Step 2
Collections & Schemas
        │
        ▼
Step 3
Cloud Storage Integration
        │
        ▼
Step 4
Security Configuration
        │
        ▼
Step 5
Composite Indexes
        │
        ▼
Step 6
Validation Rules
        │
        ▼
Step 7
AI Persistence Layer
        │
        ▼
Step 8
Lifecycle & Transactions
        │
        ▼
Step 9
Testing & Verification

Engineering Rationale
This sequence minimizes integration risk by establishing the persistence foundation before implementing AI workflows and business logic.

3.68 Common Pitfalls
Pitfall
Risk
Collection scans
High read costs and latency
Offset pagination
Poor scalability
Sequential Firestore writes
Orphaned records
Mutable AI decisions
Loss of explainability
Public storage buckets
Security vulnerability
Manual vector comparison
Excessive memory usage
Direct client writes
Trust boundary violation
Missing composite indexes
Runtime Firestore failures
Automatic Gemini retries
Latency spikes and inconsistent AI outputs

Engineers must avoid these patterns.

3.69 Chapter Completion Checklist
✓ Database philosophy defined
✓ Firestore collections defined
✓ Document schemas complete
✓ Collection relationships documented
✓ Query specifications complete
✓ Composite indexes identified
✓ Native vector search defined
✓ Cloud Storage architecture documented
✓ Embedding strategy complete
✓ Security model documented
✓ Lifecycle defined
✓ Failure handling documented
✓ Reliability principles documented
✓ Performance considerations complete
✓ Cost optimization documented
✓ Naming conventions standardized
✓ Engineering constraints documented
✓ Ready for implementation

━━━━━━━━━━━━━━━━━━━━━━
Part E Status
COMPLETE
Dependencies
Chapter 1 — Executive Summary & Product Definition
Chapter 2 — System Architecture & Component Design
Chapter 3 Parts A–D
Implementation Readiness
READY
The complete persistence layer is now fully specified. A backend engineer can implement Firestore, Cloud Storage, security, lifecycle management, indexing, performance optimization, and operational persistence without making additional architectural decisions.
Final Chapter Status
Chapter 3 — COMPLETE & LOCKED
Ready for Technical Review
YES
Next Chapter
Chapter 4 – API Specification & Backend Contracts
━━━━━━━━━━━━━━━━━━━━━━


