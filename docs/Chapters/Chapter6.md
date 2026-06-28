PROJECT_SPEC.md
Chapter 6 – Frontend Architecture & UI Specification
Part A – Frontend Foundation
Status: Implementation Specification
Architecture Status: LOCKED

6.1 Purpose
This chapter defines the frontend architecture of CityOps AI.
The frontend is responsible for presenting the AI Decision Engine in a simple, transparent, and intuitive manner while remaining completely independent from backend implementation details.
This document specifies:
Frontend architecture
Navigation
Component organization
State management
Engineering standards
No implementation code is included.

6.2 Frontend Design Philosophy
The frontend is designed around one principle:
Make the AI understandable, not invisible.
The product is not simply a complaint submission application. The AI Decision Engine is the primary differentiator and must therefore be visible throughout the user journey.

6.2.1 User-Centered Design
The interface prioritizes clarity over functionality density.
Every screen should answer one question:
What is happening?
What should the user do next?
What decision has the AI made?
Users should never need to understand the backend architecture.

6.2.2 AI Transparency
Unlike traditional AI systems where reasoning happens invisibly, CityOps AI intentionally exposes the AI's progress.
Users should see:
Image Analysis
Evidence Gathering
Decision Generation
Confidence Status
Final Recommendation
The objective is to build trust rather than hide complexity.

6.2.3 Simplicity over Complexity
The MVP intentionally limits:
navigation depth
page count
feature count
visual complexity
Only interfaces directly supporting the demo and operational workflow are included.

6.2.4 Demo-First Thinking
Every screen exists because it contributes to the live demonstration.
Interfaces that do not strengthen:
AI visibility
operational workflow
judge understanding
are intentionally excluded.
The demo flow remains the primary UX optimization target.


6.2.5 Demo-First Product Philosophy (LOCKED)
CityOps AI is being developed for a competitive hackathon where judges experience the product through a short live demonstration.
Therefore, frontend decisions prioritize clarity of the AI workflow over production-scale feature completeness.
Every screen, interaction, and visual element must satisfy at least one of the following objectives:
Demonstrate the AI Decision Engine.
Improve user understanding.
Strengthen operational transparency.
Increase demo impact.
Support judging criteria.
If a screen does not contribute to these objectives, it shall not be implemented in the MVP.

6.2.6 MVP Screen Policy
The frontend is intentionally limited to the smallest set of screens required for the complete end-to-end workflow.
Citizen Experience
Upload Report
AI Processing
Resolution Summary
Confirmation
Submission Success
Authority Experience
Dashboard
Human Review Queue
Work Order Details
No additional screens are part of the MVP.
The following are explicitly excluded:
User profiles
Settings
Notifications center
Report history pages
Analytics pages
Search interfaces
Administration panels
Configuration screens
Theme customization
Multi-language support
Advanced filtering beyond demo needs
These features may be added after the hackathon but are outside the implementation scope.

6.2.7 Demo Visibility Principle
The AI Decision Engine is the product's primary differentiator.
The frontend shall maximize its visibility.
The following must always be visible during AI execution:
Current execution stage
Tool invocations
Evidence gathered
Confidence evolution
Final operational reasoning
Generic loading indicators are prohibited whenever AI processing is occurring.
The user should always understand what the AI is doing.

6.2.8 UI Elimination Rule
Before implementing any new screen or component, the Engineering Lead shall answer:
Does this strengthen the live demonstration?
Does this improve the user's understanding?
Does this directly support one of the judging criteria?
If the answer to all three questions is No, the feature shall not be implemented.
This rule takes precedence over feature completeness.

6.2.9 Demo Priority Order
When implementation time becomes limited, development priority shall follow this order:
AI Processing Timeline
Resolution Summary
Authority Dashboard
Human Review Queue
Upload Experience
Work Order Details
Visual polish
All other features are lower priority.
The objective is not to build the largest application.
The objective is to build the most convincing demonstration of an AI-powered municipal decision engine.

6.3 Frontend Architecture
The frontend follows a layered architecture.
+------------------------------------------------+
|                 Presentation Layer             |
|  Pages • Layouts • Shared Components           |
+------------------------------------------------+
|                 State Layer                    |
| Global • Local • API • AI Runtime State        |
+------------------------------------------------+
|                Service Layer                   |
| API Client • Auth • Upload • Utilities         |
+------------------------------------------------+
|               Backend APIs                     |
+------------------------------------------------+

Responsibilities remain strictly separated.

6.4 Folder Organization
The recommended frontend organization is:
src/
│
├── app/
├── pages/
│   ├── citizen/
│   ├── authority/
│   ├── review/
│   └── shared/
│
├── components/
│   ├── common/
│   ├── citizen/
│   ├── authority/
│   ├── ai/
│   └── dashboard/
│
├── services/
├── hooks/
├── store/
├── utils/
├── assets/
└── types/

Business logic should remain inside services and hooks rather than UI components.

6.5 Page Hierarchy
The application contains two primary experiences.
Application
│
├── Citizen Experience
│      │
│      ├── Upload
│      ├── AI Processing
│      ├── Resolution Summary
│      ├── Confirmation
│      └── Report Status
│
└── Authority Experience
       │
       ├── Dashboard
       ├── Active Work Orders
       ├── Human Review
       └── Work Order Details

No additional pages are part of the MVP.

6.6 Component Hierarchy
App
│
├── Navigation
│
├── Citizen Layout
│      │
│      ├── UploadForm
│      ├── ImagePreview
│      ├── AIProgressTimeline
│      ├── ResolutionSummary
│      └── ConfirmationDialog
│
└── Authority Layout
       │
       ├── DashboardHeader
       ├── StatisticsCards
       ├── IssueMap
       ├── WorkOrderTable
       ├── HumanReviewPanel
       └── WorkOrderDrawer

Components communicate through state and API services rather than direct coupling.

6.7 Shared Components
Reusable components include:
Component
Purpose
Button
Standard actions
Card
Content grouping
Modal
Confirmation dialogs
Loading Indicator
Async operations
Timeline
AI reasoning visualization
Badge
Status indicators
Status Chip
Confidence & lifecycle states
Toast
Notifications
Empty State
No data screens
Error Banner
Recoverable failures

These components must remain presentation-only.

6.8 Navigation Structure
Navigation is intentionally minimal.
Landing
   │
   ├─────────────┐
   ▼             ▼
Citizen      Authority
Experience   Dashboard

Citizen and Authority interfaces are isolated.

Citizen Routes
/
│
├── /report
├── /processing
├── /summary
├── /confirmation
└── /status/:id


Authority Routes
/authority
│
├── /dashboard
├── /work-orders
├── /review
└── /work-orders/:id


Protected Routes
Authority routes require authenticated authority users.
Citizen routes require authenticated citizens except the landing page.

Navigation Diagram
Landing
   │
   ▼
Upload Report
   │
   ▼
AI Processing
   │
   ▼
Resolution Summary
   │
   ▼
Citizen Confirmation
   │
   ▼
Status Tracking

Authority workflow remains independent.

6.9 State Management
Frontend state is divided into specialized domains.

Global State
Contains:
authenticated user
user role
application theme
notifications
Global state changes infrequently.

Local State
Owned by individual components.
Examples:
modal visibility
form inputs
selected filters
map selection
Local state should not be shared unnecessarily.

API State
Represents server data.
Includes:
work orders
reports
dashboard statistics
review queue
API state is refreshed through backend endpoints.

Loading State
Tracks asynchronous operations.
Loading states include:
uploading
AI processing
dashboard loading
review submission
Every asynchronous operation must expose visible progress.

Error State
Handles recoverable failures.
Examples:
upload failed
network unavailable
AI unavailable
dashboard fetch failed
Errors should never leave the interface in an undefined state.

AI Processing State
A dedicated runtime state represents the AI execution lifecycle.
Possible states:
Uploading

↓

Vision Analysis

↓

Evidence Gathering

↓

Reasoning

↓

Generating Decision

↓

Completed

This state powers the visible AI timeline shown during the demo.

6.10 Component Responsibilities

Upload Form
Purpose
Collect citizen report information.
Inputs
image
optional description
Outputs
upload request
Dependencies
Upload Service
Owner
Citizen Experience

AI Progress Timeline
Purpose
Visualize AI execution progress.
Inputs
AI processing state
Outputs
Timeline visualization
Dependencies
AI Runtime State
Owner
AI Experience

Resolution Summary
Purpose
Present the AI-generated operational recommendation.
Inputs
AI Decision
Outputs
Citizen-readable explanation
Dependencies
AI API
Owner
AI Experience

Issue Map
Purpose
Display operational work orders geographically.
Inputs
Work orders
Outputs
Interactive visualization
Dependencies
Google Maps
Owner
Authority Experience

Work Order Table
Purpose
Display operational queue.
Inputs
Work orders
Outputs
Selection events
Dependencies
Dashboard API
Owner
Authority Dashboard

Human Review Panel
Purpose
Support manual verification.
Inputs
Review queue
Outputs
Approval / modification actions
Dependencies
Review API
Owner
Authority Experience

6.11 Frontend Engineering Principles
The frontend follows strict engineering standards.

FE-001 Component Isolation
Components own only presentation logic.
Business rules remain in services.

FE-002 Single Responsibility
Each component performs one clearly defined task.
Large multi-purpose components are prohibited.

FE-003 API-Driven UI
The frontend reflects backend state.
Business decisions are never duplicated in the client.

FE-004 Stateless Shared Components
Reusable UI components remain stateless whenever possible.

FE-005 Predictable State
Global state is minimized.
Local state is preferred whenever practical.

FE-006 Visible AI
AI execution must always be visible.
Users should never experience unexplained waiting.

FE-007 Responsive Feedback
Every asynchronous action must provide:
loading indicator
success feedback
recoverable error state

FE-008 Accessibility
Interfaces should support:
keyboard navigation
semantic structure
readable typography
sufficient visual contrast
Accessibility improvements must not compromise demo simplicity.

FE-009 Consistency
All pages should follow consistent:
spacing
typography
colors
component behavior
interaction patterns

FE-010 Backend Independence
UI components depend only on documented API contracts.
They must never rely on Firestore schemas or internal backend implementation details.

Part A Status
Status: COMPLETE
Dependencies
Chapter 1 – Executive Summary & Product Definition
Chapter 2 – System Architecture & Component Design
Chapter 3 – Database Design & Firestore Specification
Chapter 4 – API Specification & Backend Contracts
Chapter 5 – AI Decision Engine Specification
Implementation Readiness
READY
The frontend architecture has been fully defined, including design philosophy, application structure, navigation, state management, component hierarchy, responsibilities, and engineering principles. The Engineering Lead can begin frontend implementation without introducing new architectural decisions.
Ready for Review
YES
Next Part
Chapter 6 – Part B – Citizen & Authority Experience
PROJECT_SPEC.md
Chapter 6 – Frontend Architecture & UI Specification
Part B – Citizen & Authority Experience
Status: Implementation Specification
Architecture Status: LOCKED

6.12 Purpose
This section defines the complete user experience for both primary user groups:
Citizens
Municipal Authorities
The objective is to translate the backend architecture (Chapters 2–5) into intuitive user journeys while making the AI Decision Engine transparent and trustworthy.
The frontend should never expose implementation complexity, but it must clearly communicate the AI's reasoning process.

6.13 Citizen Application
The Citizen Application focuses on a simple five-step experience:
Report an issue
Watch AI analysis
Review AI recommendation
Confirm submission
Track report status
The citizen never interacts directly with municipal workflows.

6.14 Upload Screen
Purpose
Collect the information required for the AI Decision Engine.

Inputs
Photo (required)
GPS Location (required)
Optional citizen description

UI Components
Camera / Gallery selector
Image preview
Location indicator
Description text area
Submit button

Responsibilities
Validate required inputs
Display upload progress
Prevent duplicate submissions
Send upload request to backend

User Experience
+--------------------------------------+
| Report Municipal Issue               |
|--------------------------------------|
| [ Upload Image ]                     |
|                                      |
|  Image Preview                       |
|                                      |
| Location: ✓ Captured                 |
|                                      |
| Description (Optional)               |
| __________________________           |
|                                      |
| [ Analyze with AI ]                  |
+--------------------------------------+


6.15 AI Processing Screen
Purpose
Provide complete transparency into AI execution.
This screen is the primary demonstration of Agentic AI.
The user must never experience a blank loading spinner.

Processing Timeline
The UI visualizes each stage of execution.
Upload Complete            ✓

Vision Analysis            ✓

Evidence Gathering         ⟳

Decision Reasoning         …

Generating Recommendation  …

Preparing Summary          …

Each completed stage becomes visually locked.
Current stage remains animated.
Future stages remain inactive.

Live Processing Indicators
The interface should progressively display:
✓ Image successfully analyzed

✓ Issue detected: Pothole

✓ Confidence: 82%

✓ Checking nearby reports...

✓ Retrieving road metadata...

✓ Comparing duplicate reports...

✓ Final reasoning...

These updates correspond to backend events rather than artificial timers.

6.16 Resolution Summary
Purpose
Present the AI recommendation before the citizen confirms submission.
The summary should balance technical transparency with readability.

Displayed Information
Detected Issue
Example:
Pothole


Severity
High


Suggested Department
Road Maintenance


Recommended Action
Example:
Repair using cold-mix asphalt within 24 hours.


Confidence
Displayed as:
AI Confidence

94%

High Confidence

Low-confidence recommendations display:
Needs Human Review

instead of an automation badge.

Evidence Summary
Example:
Evidence Used

✓ Nearby reports found

✓ Arterial road

✓ Duplicate similarity: 91%

Only evidence actually used by the Decision Engine may be displayed.

6.17 Citizen Confirmation
The citizen confirms that the report should be submitted.
No AI-generated fields may be edited.
Editable fields:
Optional description
Non-editable fields:
Issue type
Severity
Department
Confidence
Evidence
Recommendation

Confirmation Screen
---------------------------------------

Issue

Pothole

Severity

High

Department

Road Maintenance

Recommended Action

Repair within 24 hours

[ Confirm Report ]

---------------------------------------


6.18 Submission Success
After confirmation:
Report is persisted
Ticket enters municipal workflow
Tracking identifier is shown

Displayed information:
Report Submitted

Tracking ID

REP_2026_001928

Status

Pending Municipal Processing

Users may later monitor status through the Report Status screen.

6.19 Authority Dashboard
The Authority Dashboard is the operational workspace for municipal staff.
Unlike the Citizen Application, it focuses on workload management rather than AI transparency.

Dashboard Sections
Dashboard

│

├── Statistics

├── Active Work Orders

├── Human Review Queue

├── Completed Work Orders

└── Issue Details


6.20 Dashboard Overview
Displays operational metrics.
Examples:
Active Work Orders
Reports Awaiting Review
Completed Today
Average AI Confidence
Summary cards should load immediately upon dashboard entry.

6.21 Active Queue
Purpose:
Display verified work orders requiring action.
Displayed columns include:
Issue Type
Priority
Department
Confidence
Status
Assigned Officer
Sorting:
Priority
Creation Time
Department
Filtering:
Issue Type
Status
Department

6.22 Human Review Queue
Purpose
Display reports that the AI could not confidently automate.
Only low-confidence reports appear.
Typical causes:
blurry image
conflicting evidence
insufficient evidence
unsupported issue
infrastructure failure

Displayed Information
Image
AI confidence
Reason for escalation
Evidence summary
AI recommendation
Suggested department

Authority Actions
Authorities may:
Approve recommendation
Modify recommendation
Reject recommendation
Request additional inspection
Every decision generates an Audit Log entry.

6.23 Issue Details
Selecting a work order opens the detailed operational view.
Contents include:
Original image
Location
AI reasoning summary
Tool execution history
Evidence summary
Confidence
Department
Operational recommendation
Current lifecycle state
Authorities cannot modify historical AI reasoning.

6.24 Status Updates
Authorities may update operational status.
Allowed transitions include:
Pending

↓

Active

↓

In Progress

↓

Completed

↓

Archived

Every transition updates:
Firestore
Audit Log
Dashboard
Citizen status

6.25 AI Reasoning Timeline
The Reasoning Timeline is the signature UI element of CityOps AI.
It transforms backend execution into a visible, understandable process.
This directly supports the project's Agentic AI narrative.

Timeline Structure
Image Received

↓

Vision Analysis

↓

Issue Identified

↓

Evidence Gathering

↓

Reasoning

↓

Confidence Evaluation

↓

Operational Decision

↓

Recommendation Generated

Each stage expands to reveal supporting information.

Evidence Gathering
The timeline displays every successful tool invocation.
Example:
Evidence Gathering

✓ Nearby Reports

2 reports found

✓ Road Metadata

Arterial Road

✓ Duplicate Detection

91% Similarity

Only tools actually executed are shown.
Unused tools do not appear.

Confidence Evolution
Confidence should visibly evolve throughout execution.
Example:
Vision

82%

↓

Nearby Reports

88%

↓

Road Metadata

91%

↓

Duplicate Detection

94%

↓

Final Decision

This demonstrates evidence-driven reasoning rather than static AI output.

Tool Execution Visualization
Each tool invocation displays:
Nearby Reports

Status

Success

Duration

142 ms

Observation

2 nearby reports

This reinforces the system's tool-augmented reasoning model.

Final Recommendation
The final timeline stage summarizes:
Priority
Department
Confidence
Recommendation
Human Review status (if applicable)

6.26 Human Review Queue Experience
Low-confidence reports follow a dedicated workflow.
Low Confidence

↓

Human Review Queue

↓

Authority Verification

↓

Approve / Modify / Reject

↓

Operational Workflow

The AI never bypasses this process.

6.27 Complete User Flows
Citizen Journey
Landing

↓

Upload Image

↓

AI Processing

↓

Resolution Summary

↓

Citizen Confirmation

↓

Report Submitted

↓

Track Status


Authority Journey
Login

↓

Dashboard

↓

Active Queue

↓

Review Work Order

↓

Update Status

↓

Complete Work Order

↓

Archive


Human Review Journey
Low Confidence

↓

Human Review Queue

↓

Inspect Evidence

↓

Verify Recommendation

↓

Approve

↓

Operational Queue


End-to-End System Journey
Citizen Upload

↓

AI Vision Analysis

↓

Evidence Gathering

↓

Operational Reasoning

↓

Resolution Summary

↓

Citizen Confirmation

↓

Firestore

↓

Authority Dashboard

↓

Status Updates

↓

Resolved

↓

Archived

This flow remains fully consistent with the architecture defined in Chapters 2–5.

6.28 UX Engineering Principles
The frontend experience follows these mandatory principles.
ID
Principle
UX-001
Every AI action must be visible.
UX-002
Users must never wait behind an unexplained loading spinner.
UX-003
AI recommendations must always include supporting evidence.
UX-004
Human Review must be clearly distinguishable from verified recommendations.
UX-005
Citizen and Authority workflows remain independent.
UX-006
Authority users can override recommendations but never rewrite AI history.
UX-007
Timeline stages reflect actual backend execution events.
UX-008
Simplicity takes precedence over feature density.


Part B Status
Status: COMPLETE
Implementation Readiness
READY
The complete Citizen Experience, Authority Experience, AI Reasoning Timeline, Human Review workflow, and end-to-end user journeys have been fully specified. The Engineering Lead can now implement the application's primary user interfaces while remaining fully aligned with the locked backend architecture and AI workflow.
Ready for Review
YES
Next Part
Chapter 6 – Part C – Component Specifications & Design System
PROJECT_SPEC.md
Chapter 6 – Frontend Architecture & UI Specification
Part C – Frontend Engineering Standards
Status: Implementation Specification
Architecture Status: LOCKED

6.29 Purpose
This section defines the engineering standards governing the frontend implementation of CityOps AI.
While Parts A and B described the application architecture and user experience, this section establishes the quality standards that every frontend component must satisfy.
The objective is to ensure that the frontend remains:
consistent
performant
accessible
maintainable
demo-ready
without requiring future architectural decisions.

6.30 UI States
Every screen must explicitly define all possible UI states.
A component should never appear in an undefined or ambiguous state.

6.30.1 Loading State
Purpose
Inform users that an operation is currently in progress.
Loading indicators must be contextual rather than generic.
Examples
Uploading image
Loading dashboard
Fetching work orders
AI processing
Requirements
Show progress where possible.
Disable conflicting user actions.
Never display a blank screen.

6.30.2 Empty State
Purpose
Provide meaningful feedback when no data exists.
Examples
No active work orders
No reports submitted
No pending human reviews
Requirements
Display:
explanation
optional illustration/icon
recommended next action

6.30.3 Success State
Purpose
Confirm successful completion of user actions.
Examples
Report submitted
Status updated
Human review completed
Requirements
Include:
success confirmation
reference ID (where applicable)
next available action

6.30.4 Failure State
Purpose
Clearly communicate recoverable failures.
Examples
Upload failed
Network unavailable
Server unavailable
Request timeout
Requirements
Every failure must include:
simple explanation
retry option (when appropriate)
safe recovery path

6.30.5 AI Processing State
This is the most important runtime state in the application.
Instead of a generic loader, users observe AI execution.
Example progression:
Uploading Image
      │
      ▼
Vision Analysis
      │
      ▼
Evidence Gathering
      │
      ▼
Reasoning
      │
      ▼
Generating Recommendation
      │
      ▼
Completed

Each completed stage is permanently marked as complete.

6.30.6 Human Review State
When confidence falls below the configured threshold:
AI Recommendation

↓

Needs Human Review

↓

Authority Verification Required

The interface must clearly distinguish this state from a verified recommendation.
Users must understand that the report has not been rejected—it simply requires manual verification.

6.31 Error Handling
The frontend treats errors as recoverable events whenever possible.
Unexpected failures must never crash the application.

Network Errors
Examples:
Connection timeout
Internet unavailable
Backend unreachable
User response:
preserve entered data
display retry option
avoid duplicate submissions

AI Failures
Examples:
AI service unavailable
malformed AI response
inference failure
Behavior:
show understandable message
allow retry if upload has not expired
never expose internal error details

Upload Failures
Examples:
invalid file
storage timeout
upload interrupted
Behavior:
retain selected image
allow immediate retry
validate before re-upload

Retry Behaviour
Retry policy follows Chapter 5.
Frontend retries only:
network requests
upload operations
The frontend must never retry AI inference directly.
All AI retries are handled according to backend contracts.

6.32 Accessibility Standards
Accessibility is a core engineering requirement.

Keyboard Navigation
Every interactive element must support keyboard navigation.
Requirements:
logical tab order
visible focus indicators
keyboard activation for buttons
modal focus trapping

Color Contrast
Text and interactive elements must maintain sufficient contrast.
Color must never be the sole indicator of status.
Example:
Instead of:
Green = Complete
Use:
✓ Complete
alongside color.

Screen Reader Support
Interactive components should expose:
meaningful labels
descriptive buttons
accessible forms
semantic headings
Images should provide descriptive alternative text where appropriate.

Responsive Behaviour
The MVP supports:
Desktop (primary demo target)
Tablet
Mobile
Layout adjustments should preserve functionality rather than replicate desktop layouts.

6.33 Design System
The design system ensures a consistent visual identity across all interfaces.

Typography
Hierarchy:
Element
Usage
Heading 1
Page titles
Heading 2
Section titles
Heading 3
Cards and dialogs
Body
Standard content
Caption
Metadata and timestamps

Typography must remain consistent across all pages.

Colors
Color usage should communicate meaning.
Suggested semantic palette:
Purpose
Meaning
Primary
Main actions
Success
Completed operations
Warning
Human review required
Error
Failures
Information
AI processing

Avoid excessive decorative colors.

Icons
Icons supplement text rather than replace it.
Examples:
Upload
Camera
Map
AI
Warning
Success
Review
Completed
Icons must remain consistent throughout the application.

Cards
Cards group related information.
Standard card sections:
Header
Content
Actions
Cards should maintain consistent spacing and elevation.

Buttons
Button hierarchy:
Primary
Confirm
Submit
Save
Secondary
Cancel
Back
Retry
Destructive
Delete (if applicable)
Loading buttons must prevent duplicate actions.

Layout
Layout principles:
generous spacing
consistent alignment
responsive containers
minimal nesting
The interface should prioritize readability over information density.

Visual Consistency
Every screen should maintain:
identical spacing system
typography scale
button styles
iconography
color semantics
card appearance
This consistency reduces cognitive load for users.

6.34 Engineering Constraints

Required Consistency
All pages must follow the same design language.
No page-specific UI paradigms are permitted.

Performance Targets
Target metrics:
Metric
Target
Initial page load
< 2 seconds
Route transition
< 300 ms
Dashboard refresh
< 500 ms
AI timeline update
Real-time event driven
UI interaction response
< 100 ms


Component Standards
Every component should:
have one responsibility
receive explicit inputs
expose predictable outputs
remain reusable where practical
avoid hidden side effects

Maintainability
Frontend implementation should emphasize:
modularity
composability
readability
low coupling
high cohesion
Shared UI logic belongs in reusable hooks or services rather than duplicated across components.

6.35 Implementation Notes

Common Pitfalls
Pitfall
Why It Is Dangerous
Business logic inside UI components
Creates tight coupling and difficult testing
Direct backend schema assumptions
Breaks API abstraction
Generic loading spinners
Weakens AI transparency and demo quality
Inconsistent status indicators
Confuses users and authorities
Large monolithic components
Difficult to maintain and extend
Duplicate API calls
Increases latency and Firestore costs
Unhandled error states
Leads to broken user experience


Recommended Development Order
Shared Design System

↓

Routing & Layout

↓

Authentication

↓

Citizen Screens

↓

Authority Dashboard

↓

AI Timeline

↓

Human Review

↓

Testing & Polish

This sequence minimizes integration conflicts and enables early end-to-end testing.

Dependencies
Frontend implementation depends upon:
Chapter 3 (Database Design)
Chapter 4 (API Specification)
Chapter 5 (AI Decision Engine)
The frontend must interact exclusively through the documented API contracts.
Direct Firestore access from presentation components is prohibited.

6.36 Frontend Invariants
The following engineering rules are mandatory.
ID
Rule
FE-011
Every asynchronous operation exposes a visible UI state.
FE-012
AI processing is always represented through the Reasoning Timeline.
FE-013
Human Review recommendations are visually distinct from verified decisions.
FE-014
Components never contain backend business logic.
FE-015
Presentation components never access Firestore directly.
FE-016
All backend interactions occur through documented APIs.
FE-017
Shared components remain reusable and stateless where possible.
FE-018
UI behavior remains consistent across Citizen and Authority experiences.
FE-019
Error states are recoverable whenever possible.
FE-020
Frontend changes must preserve the locked demo flow.


6.37 Completion Checklist
Frontend Architecture
✓ Navigation defined
✓ Component hierarchy defined
✓ State management documented
✓ Engineering standards established

Citizen Experience
✓ Upload experience defined
✓ AI Processing defined
✓ Resolution Summary defined
✓ Confirmation flow defined
✓ Submission success flow defined

Authority Experience
✓ Dashboard defined
✓ Active Queue defined
✓ Human Review Queue defined
✓ Issue Details defined
✓ Status update workflow defined

Engineering Standards
✓ UI states documented
✓ Error handling documented
✓ Accessibility defined
✓ Design system documented
✓ Performance targets defined
✓ Maintainability guidelines established

Overall Verification
✓ Navigation defined
✓ Components defined
✓ Dashboard complete
✓ User flows complete
✓ UI states documented
✓ Engineering constraints defined
✓ Ready for implementation

Final Chapter Status
Chapter 6 – COMPLETE & LOCKED
Implementation Readiness
READY
The frontend architecture, user experience, engineering standards, accessibility requirements, design system, and implementation constraints have now been fully specified. The Engineering Lead can begin frontend development without making additional architectural or UX decisions.
Ready for Technical Review
YES
Next Chapter
Chapter 7 – Implementation Plan & Milestones

