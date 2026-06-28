PROJECT_SPEC.md
Chapter 4 – API Specification & Backend Contracts
Part A – API Foundation
Status: Implementation Specification
Architecture Status: LOCKED

4.1 Purpose
This chapter defines the API contract between the frontend applications and the backend services.
The API layer is responsible for:
Exposing backend capabilities through REST endpoints.
Enforcing authentication and authorization.
Validating incoming requests.
Coordinating AI processing.
Persisting operational data.
Returning consistent responses.
The API layer must not contain business-specific UI logic. Business rules belong to the backend services defined in Chapter 2.

4.2 API Design Philosophy
The CityOps AI backend follows a RESTful, resource-oriented architecture with stateless request handling.
4.2.1 Design Principles
The API follows these principles:
Resource-oriented endpoints.
Stateless requests.
JSON request/response bodies.
Predictable URL structures.
Consistent error responses.
Backend-owned business logic.
Idempotent operations where applicable.
Clients never interact directly with Firestore or Cloud Storage. All operational access flows through the backend API.

4.2.2 REST Principles
Resources are represented as nouns rather than actions.
Examples:
/reports
/work-orders
/users
/reviews

Avoid action-based routes such as:
/createReport
/updateStatus
/processImage

Operations are expressed using HTTP methods.

4.2.3 Versioning Philosophy
All endpoints are versioned.
Current API version:
/api/v1/

Future breaking changes must introduce a new version.
Example:
/api/v2/

Existing versions must remain backward compatible during migration.

4.2.4 Consistency Standards
Every endpoint must follow identical conventions for:
Authentication
Validation
Error handling
Status codes
Response format
Timestamp formatting
No endpoint-specific conventions are permitted.

4.3 Authentication Model
Authentication establishes the identity of the caller.
Authorization determines what the caller may do.
These concerns remain strictly separated.

4.3.1 Authentication Strategy
The system uses Firebase Authentication as the identity provider.
Supported identities:
Citizen Users
Authority Users
Backend Services (service accounts)
The backend verifies Firebase ID tokens before processing protected requests.

4.3.2 User Identity
Citizen identity includes:
Firebase UID
Display name (optional)
Email (optional)
Role: citizen
Citizens may access only their own reports and associated status.

4.3.3 Authority Identity
Authority users authenticate through Firebase Authentication and are assigned the role:
authority

Authorities may:
View operational work orders.
Review low-confidence cases.
Update work order status.
Access administrative dashboards.

4.3.4 Session Assumptions
The backend is completely stateless.
Each request must include a valid authentication token.
No server-side session storage is maintained.

4.3.5 Token Flow
Citizen / Authority
        │
        ▼
Firebase Authentication
        │
        ▼
ID Token
        │
        ▼
Backend API
        │
        ▼
Token Verification
        │
        ▼
Role Resolution
        │
        ▼
Endpoint Execution

Requests without valid tokens are rejected before business logic executes.

4.4 Authorization Model
Authorization follows the principle of least privilege.
Every request is evaluated based on the authenticated user's role.

4.4.1 Citizen Permissions
Citizens may:
Submit new reports.
View their own reports.
View AI Resolution Summaries.
Confirm AI-generated reports.
Track report status.
Citizens may not:
Modify AI decisions.
Access other users' reports.
View authority dashboards.
Update work orders.
Access audit history.

4.4.2 Authority Permissions
Authorities may:
View all work orders.
Access the review queue.
Review low-confidence cases.
Update work order lifecycle status.
View audit history.
Access operational dashboards.
Authorities may not:
Modify immutable AI decisions.
Alter historical audit records.
Override backend security policies.

4.4.3 Public Endpoints
Public access is intentionally minimal.
Allowed:
Health check
API status
All operational endpoints require authentication.

4.4.4 Protected Endpoints
Protected endpoints include:
Report submission
Report confirmation
Citizen report history
Work order retrieval
Dashboard data
Review queue
Status updates
Administrative operations

4.5 API Standards
Uniform API conventions are mandatory across all services.

4.5.1 Naming Conventions
Rules:
Lowercase URLs
Hyphen-separated resource names
Plural resource names
No verbs in route paths
Examples:
/reports
/work-orders
/review-queue
/dashboard


4.5.2 URL Structure
General structure:
/api/v1/{resource}

Nested resources:
/api/v1/reports/{reportId}

/api/v1/work-orders/{workOrderId}


4.5.3 HTTP Methods
Method
Purpose
GET
Retrieve resources
POST
Create resources
PUT
Replace entire resource (rare)
PATCH
Partial updates
DELETE
Administrative deletion (restricted)

PATCH is preferred over PUT for lifecycle updates.

4.5.4 JSON Conventions
All request and response bodies use JSON.
Field naming rules:
camelCase
UTF-8 encoding
No null keys unless explicitly required
Predictable object structure
Example:
{
  "reportId": "REP_000124",
  "status": "active",
  "createdAt": "2026-06-28T10:25:30Z"
}


4.5.5 Timestamp Standards
All timestamps use:
ISO-8601
UTC timezone
Example:
2026-06-28T10:25:30Z

No localized timestamps are returned by the API.

4.6 Core Endpoint Overview
The following endpoints constitute the initial backend surface.
Detailed request and response contracts are defined in Part B.
Method
Route
Purpose
Authentication
GET
/api/v1/health
Service health check
Public
POST
/api/v1/reports
Submit new citizen report
Citizen
POST
/api/v1/reports/{reportId}/confirm
Confirm AI-generated report
Citizen
GET
/api/v1/reports/{reportId}
Retrieve report details
Citizen (Owner)
GET
/api/v1/reports
Retrieve citizen report history
Citizen
GET
/api/v1/work-orders
Retrieve work orders
Authority
GET
/api/v1/work-orders/{workOrderId}
Retrieve work order details
Authority
PATCH
/api/v1/work-orders/{workOrderId}
Update work order status
Authority
GET
/api/v1/review-queue
Retrieve human review queue
Authority
PATCH
/api/v1/review-queue/{workOrderId}
Resolve human review
Authority
GET
/api/v1/dashboard
Retrieve operational dashboard data
Authority
GET
/api/v1/users/me
Retrieve authenticated user profile
Authenticated

These endpoints represent the complete MVP API surface. Additional endpoints require explicit architectural approval.

4.7 API Foundation Decisions
ID
Decision
Status
API-001
REST architecture is mandatory.
Locked
API-002
Backend is stateless.
Locked
API-003
Firebase Authentication provides identity.
Locked
API-004
Authorization is role-based.
Locked
API-005
Operational data is never accessed directly from clients.
Locked
API-006
All endpoints are versioned under /api/v1.
Locked
API-007
JSON is the exclusive payload format.
Locked
API-008
ISO-8601 UTC timestamps are mandatory.
Locked
API-009
PATCH is used for lifecycle state changes.
Locked
API-010
API contracts are the single source of truth between frontend and backend.
Locked


Part A Status
Status: COMPLETE
Dependencies
Chapter 1 – Executive Summary & Product Definition
Chapter 2 – System Architecture & Component Design
Chapter 3 – Database Design & Firestore Specification
Implementation Readiness
READY
This chapter establishes the foundational API architecture, authentication model, authorization model, and endpoint inventory. It serves as the contract baseline for both frontend and backend teams.
Ready for Review
YES
Next Part
Part B – Endpoint Specifications

Generate Chapter 4 – Part B.
Title:
Endpoint Specifications
This part defines every API endpoint in complete detail.
For every endpoint include:
Purpose
Route
HTTP Method
Authentication
Authorization
Request Schema
Response Schema
Validation Rules
Error Responses
Status Codes
Example Request
Example Response
Include endpoints for:
Citizen Upload
AI Analysis
Report Confirmation
Authority Dashboard
Human Review
Status Updates
Report Retrieval
Dashboard Statistics
Document every endpoint completely.
Implementation-ready.
No backend code.
End with:
Part B Status
Implementation Readiness
Ready for Review
Next Part:
Part C – Backend Contracts

PROJECT_SPEC.md
Chapter 4 – API Specification & Backend Contracts
Part B.2 – Authority API Specifications
Status: Implementation Specification
Architecture Status: LOCKED

4.14 Authority API Overview
Authority APIs provide the operational interface for municipal users.
These endpoints enable authorities to:
Monitor all active work orders
View AI-generated operational recommendations
Process low-confidence reports
Update work order status
Monitor dashboard metrics
Authority users never interact directly with Firestore.
All operations pass through the backend API.

4.15 Endpoint – Retrieve Work Orders
Purpose
Returns a paginated list of operational work orders for the Authority Dashboard.
Supports:
filtering
sorting
department views
pagination

Route
GET /api/v1/work-orders


Authentication
Required
Role:
Authority

Authorization
Accessible only to authenticated authority users.

Query Parameters
Parameter
Required
Description
status
Optional
active / in_progress / completed / needs_human_review
department
Optional
Department filter
priority
Optional
low / medium / high / critical
limit
Optional
Page size
cursor
Optional
Firestore cursor


Validation Rules
limit within configured maximum
valid enum values
valid cursor

Success Response
{
  "workOrders": [
    {
      "workOrderId": "WO_00381",
      "issueType": "pothole",
      "priority": "high",
      "department": "road_maintenance",
      "status": "active",
      "confidence": 0.94,
      "location": {
        "latitude": 15.3921,
        "longitude": 73.8779
      },
      "imageUrl": "https://storage.googleapis.com/..."
    }
  ],
  "nextCursor": "..."
}


Error Responses
HTTP
Reason
401
Unauthenticated
403
Forbidden
422
Invalid query
500
Internal server error


Status Codes
200
401
403
422
500

4.16 Endpoint – Retrieve Work Order Details
Purpose
Returns the complete operational view of a single work order.
Includes:
report information
AI reasoning
evidence summary
operational recommendation
audit history reference

Route
GET /api/v1/work-orders/{workOrderId}


Authentication
Required
Authority

Authorization
Authority only.

Path Parameters
Parameter
Validation
workOrderId
Existing Work Order


Success Response
{
  "workOrderId":"WO_00381",
  "status":"active",
  "issueType":"pothole",
  "department":"road_maintenance",
  "priority":"high",
  "confidence":0.94,
  "reasoning":"Two nearby reports and arterial road.",
  "recommendedAction":"Repair within 24 hours.",
  "location":{
      "latitude":15.3921,
      "longitude":73.8779
  },
  "imageUrl":"https://storage.googleapis.com/..."
}


Validation Rules
Work order exists
Authority authentication

Error Responses
401
403
404
500

Status Codes
200
401
403
404
500

4.17 Endpoint – Update Work Order Status
Purpose
Updates the operational lifecycle of a work order.
Only authority personnel may perform this action.

Route
PATCH /api/v1/work-orders/{workOrderId}


Authentication
Required
Authority

Authorization
Authority only.

Request Schema
{
  "status":"in_progress"
}


Allowed Status Values
active
in_progress
completed
archived
Transitions must comply with the lifecycle defined in Chapter 3.

Validation Rules
valid lifecycle transition
immutable completed records
work order exists

Success Response
{
  "workOrderId":"WO_00381",
  "status":"in_progress",
  "updatedAt":"2026-06-28T12:30:00Z"
}


Error Responses
HTTP
Reason
400
Invalid transition
401
Unauthenticated
403
Forbidden
404
Not found
409
State conflict
500
Internal server error


Status Codes
200
400
401
403
404
409
500

4.18 Endpoint – Retrieve Authority Dashboard
Purpose
Returns all dashboard information required by the operational interface.
The endpoint aggregates operational data and avoids multiple client requests.

Route
GET /api/v1/dashboard


Authentication
Required
Authority

Authorization
Authority only.

Success Response
{
  "summary":{
      "active":21,
      "needsReview":4,
      "completedToday":8
  },
  "departmentSummary":{
      "road_maintenance":7,
      "water_department":5,
      "electrical_department":3,
      "sanitation_department":6
  },
  "recentWorkOrders":[
      {
          "workOrderId":"WO_00381",
          "priority":"high"
      }
  ]
}


Validation Rules
Dashboard statistics are read-only.
No client modifications permitted.

Error Responses
401
403
500

Status Codes
200
401
403
500

4.19 Endpoint – Retrieve Dashboard Statistics
Purpose
Returns lightweight statistics for dashboard widgets without loading full work order lists.
Optimized for fast polling and dashboard refreshes.

Route
GET /api/v1/dashboard/statistics


Authentication
Required
Authority

Authorization
Authority only.

Success Response
{
  "activeCount":21,
  "reviewCount":4,
  "completedToday":8,
  "departmentSummary":{
      "road_maintenance":7,
      "water_department":5,
      "electrical_department":3,
      "sanitation_department":6
  },
  "updatedAt":"2026-06-28T17:45:00Z"
}


Validation Rules
Statistics are derived from operational collections.
Clients cannot modify statistics.

Error Responses
401
403
500

Status Codes
200
401
403
500

4.20 Authority API Invariants
The following rules are mandatory.
ID
Rule
AUTH-001
Authority endpoints require authenticated authority role.
AUTH-002
Work Orders are the operational source of truth.
AUTH-003
AI Decisions remain immutable.
AUTH-004
Every status update generates an Audit Log entry.
AUTH-005
Lifecycle transitions must follow the state machine defined in Chapter 3.
AUTH-006
Dashboard statistics are derived data and never directly modified.
AUTH-007
Authority users cannot modify citizen report content.
AUTH-008
Every update must update updatedAt.


Part B.2 Status
Status: COMPLETE
Implementation Readiness
READY
The complete authority-facing API contract has been defined, including work order management, dashboard retrieval, lifecycle updates, authorization, validation, response standards, and operational invariants.
Ready for Review
YES
Next Part
Part B.3 – Human Review, Common Response Models & API Contracts
PROJECT_SPEC.md
Chapter 4 – API Specification & Backend Contracts
Part B.3 – Human Review APIs, Common Response Models & API Contracts
Status: Implementation Specification
Architecture Status: LOCKED

4.21 Human Review API Overview
Human Review APIs support the Responsible AI workflow defined in Chapters 2 and 3.
Reports that cannot be confidently processed by the AI Decision Engine are routed to the Human Review Queue.
Only authority users may access these endpoints.
The review process does not modify AI history.
Instead, it records the human decision while preserving the original AI output for explainability and auditability.

4.22 Endpoint – Retrieve Human Review Queue
Purpose
Returns all work orders currently awaiting manual verification.
Supports:
priority ordering
pagination
department filtering

Route
GET /api/v1/review-queue


Authentication
Required
Role:
Authority

Authorization
Authority only.

Query Parameters
Parameter
Required
Description
department
Optional
Filter by department
priority
Optional
Filter by priority
limit
Optional
Page size
cursor
Optional
Pagination cursor


Validation Rules
Valid cursor
Valid department
Valid priority
Cursor pagination only

Success Response
{
  "reviewQueue": [
    {
      "workOrderId": "WO_00381",
      "reportId": "REP_000381",
      "issueType": "pothole",
      "confidence": 0.58,
      "reason": "Low confidence after evidence gathering.",
      "priority": "medium",
      "createdAt": "2026-06-28T10:25:30Z"
    }
  ],
  "nextCursor": "..."
}


Error Responses
HTTP
Reason
401
Unauthenticated
403
Forbidden
422
Invalid query
500
Internal server error


Status Codes
200
401
403
422
500

4.23 Endpoint – Complete Human Review
Purpose
Allows an authority user to approve or modify the AI recommendation.
Human review determines the final operational state.

Route
PATCH /api/v1/review-queue/{workOrderId}


Authentication
Required
Authority

Authorization
Authority only.

Request Schema
{
  "decision": "approve",
  "updatedPriority": "high",
  "updatedDepartment": "road_maintenance",
  "reviewNotes": "Confirmed after manual inspection."
}


Request Fields
Field
Type
Required
Validation
decision
Enum
✓
approve / modify / reject
updatedPriority
Enum
Optional
Valid priority
updatedDepartment
Enum
Optional
Valid department
reviewNotes
String
Optional
Max 500 characters


Validation Rules
Work order exists
Current status = needs_human_review
Valid lifecycle transition
Review notes ≤ 500 characters

Success Response
{
  "workOrderId":"WO_00381",
  "status":"active",
  "reviewCompleted":true,
  "reviewedBy":"AUTH_004",
  "updatedAt":"2026-06-28T12:30:00Z"
}


Error Responses
HTTP
Reason
400
Invalid review action
401
Unauthenticated
403
Forbidden
404
Work order not found
409
Already reviewed
500
Internal server error


Status Codes
200
400
401
403
404
409
500

4.24 Common Success Response Contract
Every successful response follows a consistent structure.
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {
    "...": "endpoint-specific payload"
  },
  "timestamp": "2026-06-28T12:30:00Z"
}


Response Rules
Every successful response must include:
success
message
data
timestamp
No additional wrapper objects are permitted.

4.25 Common Error Response Contract
All errors follow a standardized structure.
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Latitude is required.",
    "details": [
      {
        "field": "latitude",
        "reason": "Missing required field"
      }
    ]
  },
  "timestamp": "2026-06-28T12:31:04Z"
}


Standard Error Codes
Code
Meaning
VALIDATION_ERROR
Request validation failed
UNAUTHORIZED
Authentication missing
FORBIDDEN
Permission denied
NOT_FOUND
Requested resource missing
CONFLICT
Lifecycle conflict
RATE_LIMITED
Too many requests
AI_UNAVAILABLE
Gemini unavailable
INTERNAL_ERROR
Unexpected backend error


4.26 Common HTTP Status Code Reference
HTTP
Meaning
200
Successful request
201
Resource created
400
Bad request
401
Unauthenticated
403
Forbidden
404
Not found
409
Conflict
413
Payload too large
415
Unsupported media type
422
Validation failed
429
Rate limited
500
Internal server error
503
Dependent service unavailable


4.27 API Validation Standards
Every endpoint must perform validation in the following order:
Authentication
        │
        ▼
Authorization
        │
        ▼
Request Validation
        │
        ▼
Business Rule Validation
        │
        ▼
Service Execution
        │
        ▼
Response Validation

Execution must stop immediately when any validation stage fails.

4.28 API Contract Invariants
The following rules apply to every API endpoint.
ID
Rule
API-C-001
All endpoints return JSON.
API-C-002
ISO-8601 UTC timestamps are mandatory.
API-C-003
Every protected endpoint requires Firebase authentication.
API-C-004
Authorization is role-based.
API-C-005
Clients never communicate directly with Firestore or Cloud Storage.
API-C-006
AI-generated fields are immutable through public APIs.
API-C-007
Lifecycle transitions must follow the Chapter 3 state machine.
API-C-008
Every state-changing operation creates an Audit Log entry.
API-C-009
API contracts are backward compatible within the same version.
API-C-010
All collection identifiers use immutable IDs.
API-C-011
Cursor pagination is mandatory for collection endpoints.
API-C-012
Every error response follows the common error contract.


4.29 Backend Contract Summary
The backend exposes three logical API groups.
                   REST API

        ┌──────────────────────────┐
        │     Citizen APIs         │
        │--------------------------│
        │ Submit Report            │
        │ Confirm Report           │
        │ Retrieve Reports         │
        │ Track Status             │
        └────────────┬─────────────┘
                     │
                     ▼
              AI Decision Engine
                     │
                     ▼
        ┌──────────────────────────┐
        │    Authority APIs        │
        │--------------------------│
        │ Dashboard                │
        │ Work Orders              │
        │ Status Updates           │
        └────────────┬─────────────┘
                     │
                     ▼
        ┌──────────────────────────┐
        │ Human Review APIs        │
        │--------------------------│
        │ Review Queue             │
        │ Manual Verification      │
        └──────────────────────────┘


4.30 Chapter 4 Part B Completion Summary
The complete API surface for the MVP is now specified.
Defined endpoint groups:
Citizen APIs
Authority APIs
Human Review APIs
Also standardized:
Authentication
Authorization
Request validation
Response models
Error contracts
HTTP status codes
API invariants
This document is now the single source of truth for communication between the frontend and backend.

Part B.3 Status
Status: COMPLETE
Implementation Readiness
READY
All MVP endpoints, response contracts, validation standards, authorization rules, and API invariants have been fully specified. The frontend and backend teams can implement independently using this document as the integration contract.
Ready for Review
YES
Next Part
Part C – Backend Service Contracts & Internal Interfaces

PROJECT_SPEC.md
Chapter 4 – API Specification & Backend Contracts
Part C – Backend Contracts & Engineering Standards
Status: Implementation Specification
Architecture Status: LOCKED

4.31 Purpose
This section defines the internal backend contracts, ownership boundaries, engineering standards, and operational guarantees for CityOps AI.
Unlike Parts A and B, this section specifies how backend services collaborate internally, not how clients communicate with the API.
These contracts are mandatory for all backend implementations.

4.32 Backend Service Responsibilities
The backend is organized into independent service modules with clearly defined ownership.
No service may directly assume another service's responsibilities.

4.32.1 AI Service
Purpose
Owns the complete AI Decision Engine execution pipeline.
Responsibilities
Invoke Gemini Vision (Tool 0)
Execute the AI Orchestrator
Execute tool selection loop
Collect deterministic evidence
Evaluate confidence
Produce final Resolution Summary
Return structured AI Decision object
Does NOT Own
Firestore persistence
Authentication
Dashboard aggregation
Storage uploads
Inputs
Image URL
GPS coordinates
Citizen description
Outputs
Structured AI Decision
Confidence score
Tool execution history
Resolution Summary

4.32.2 Firestore Service
Purpose
Owns all operational database interactions.
Responsibilities
Batched Writes
Collection CRUD
Query execution
Pagination
Transactions
Dashboard metadata updates
Does NOT Own
AI inference
Authentication
Image storage
Inputs
Validated domain objects.
Outputs
Persisted Firestore documents.

4.32.3 Storage Service
Purpose
Owns Cloud Storage operations.
Responsibilities
Upload images
Generate storage paths
Metadata validation
Thumbnail management
Signed URL generation
Storage cleanup coordination
Does NOT Own
AI processing
Database updates

4.32.4 Dashboard Service
Purpose
Provides optimized data for authority dashboards.
Responsibilities
Dashboard aggregation
Dashboard statistics
Work order summaries
Department metrics
Review queue summaries
Dashboard Service must never execute AI.

4.32.5 Authentication Service
Purpose
Owns identity verification.
Responsibilities
Verify Firebase ID Tokens
Resolve user roles
Attach authenticated user context
Reject unauthorized requests
Does NOT Own
Authorization business logic
Firestore operations

4.33 Internal Service Contracts
The following ownership model is mandatory.
               Client Request
                      │
                      ▼
             Authentication Service
                      │
                      ▼
                 API Controller
                      │
         ┌────────────┴────────────┐
         ▼                         ▼
    Storage Service          AI Service
         │                         │
         └────────────┬────────────┘
                      ▼
              Firestore Service
                      │
                      ▼
             Dashboard Service
                      │
                      ▼
                HTTP Response


Service Ownership Rules
Service
Owns
Authentication
Identity verification
AI Service
AI reasoning
Firestore Service
Persistence
Storage Service
Images
Dashboard Service
Aggregated views

Cross-service database access is prohibited.

4.34 Logging Strategy
Logging supports debugging, observability, and auditability.
Logs are categorized into four levels.
Level
Purpose
INFO
Normal operations
WARN
Recoverable issues
ERROR
Failed operations
AUDIT
Business-critical actions


Required Log Events
The following operations must always be logged:
Report submission
AI execution start/end
Tool invocation
Confidence evaluation
Firestore transaction
Human review completion
Work order status update
Authentication failures
Authorization failures
Storage upload failures
Sensitive information must never appear in logs.

4.35 Error Logging
Unexpected failures must produce structured error logs.
Each log entry should include:
Timestamp
Request ID
User ID (if authenticated)
Endpoint
Service
Error category
Correlation ID
Stack traces must only be available in backend logs.
They must never be returned to clients.

4.36 Rate Limiting
Rate limiting protects backend resources.
Recommended limits:
Endpoint Type
Limit
Report Submission
10 requests/hour/user
Report Retrieval
60 requests/minute
Dashboard
120 requests/minute
Review Queue
60 requests/minute
Authentication
Provider managed

Rate limiting should be enforced before expensive AI execution begins.

4.37 Retry Strategy
Retries are intentionally conservative.
Recoverable Operations
Retry (maximum one attempt):
Firestore write failures
Cloud Storage upload failures
Temporary network interruptions
Non-Recoverable Operations
Do NOT retry automatically:
Gemini inference
AI orchestration
Validation failures
Authorization failures
Instead:
Return safe error responses
Reduce confidence where applicable
Route to Human Review if appropriate
This preserves the latency budget established in Chapter 2.

4.38 API Versioning
The API follows semantic versioning through URL namespaces.
Current version:
/api/v1

Rules:
Breaking changes require /v2
Additive changes remain within /v1
Existing contracts remain stable throughout the hackathon
Deprecated versions must remain operational until migration is complete.

4.39 Engineering Constraints
The following constraints are mandatory.
Backend Invariants
AI Decisions are immutable.
Audit Logs are append-only.
Firestore is the operational source of truth.
Clients never access Firestore directly.
Every operational write occurs through the backend.
Every state transition creates an Audit Log.
Every protected endpoint validates Firebase identity before execution.
Dashboard statistics are derived, never manually edited.
Cursor pagination is mandatory for collection endpoints.

Required Guarantees
The backend guarantees:
Atomic persistence of related documents using Firestore Batched Writes.
Consistent API response contracts.
Deterministic validation order.
Role-based authorization.
Graceful degradation when dependent services fail.

4.40 Common Pitfalls
Engineers must avoid the following implementation mistakes.
Pitfall
Why It Is Dangerous
Direct Firestore access from frontend
Breaks trust boundary
Sequential writes instead of batched writes
Creates orphaned records
Retrying Gemini requests
Increases latency and API cost
Modifying AI Decisions
Breaks explainability
Returning stack traces to clients
Security risk
Offset pagination
Poor Firestore scalability
Manual vector comparison
Memory inefficiency
Missing composite indexes
Runtime Firestore failures
Business logic inside controllers
Poor maintainability
Service-to-service responsibility leakage
Tight coupling


4.41 Implementation Notes
Recommended implementation order for the Engineering Lead:
Authentication
        │
        ▼
Storage Service
        │
        ▼
Firestore Service
        │
        ▼
AI Service
        │
        ▼
Dashboard Service
        │
        ▼
API Controllers
        │
        ▼
Validation Middleware
        │
        ▼
Integration Testing

Engineering Guidance
Implement services before controllers.
Controllers should orchestrate services, not contain business logic.
Validation middleware should execute before controller logic.
AI Service must remain isolated to simplify prompt iteration and testing.
Preserve all contracts defined in Chapters 2–4.

4.42 Chapter 4 Completion Checklist
API Foundation
✓ REST architecture defined
✓ Authentication model defined
✓ Authorization model defined
✓ API standards documented

Endpoint Specifications
✓ Citizen APIs documented
✓ Authority APIs documented
✓ Human Review APIs documented
✓ Request schemas defined
✓ Response schemas defined
✓ Validation rules documented
✓ Error responses standardized
✓ Status codes documented

Backend Contracts
✓ Backend responsibilities defined
✓ Internal service ownership documented
✓ Logging strategy defined
✓ Error logging documented
✓ Rate limiting defined
✓ Retry strategy defined
✓ Versioning documented
✓ Engineering constraints documented
✓ Common pitfalls documented
✓ Implementation notes completed

Overall Verification
✓ Every endpoint documented
✓ Authentication complete
✓ Authorization complete
✓ Validation complete
✓ Backend contracts complete
✓ Engineering standards complete
✓ Ready for implementation

Part C Status
Status: COMPLETE
Final Chapter Status
Chapter 4 – COMPLETE & LOCKED
Implementation Readiness
READY
The complete backend API surface, service responsibilities, engineering standards, and internal contracts have now been fully specified. The Engineering Lead can implement the backend without making additional architectural decisions.
Ready for Technical Review
YES
Next Chapter
Chapter 5 – AI Decision Engine Specification

