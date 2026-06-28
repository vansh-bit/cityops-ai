# IMPLEMENTATION_CONTEXT.md

**Project:** CityOps AI

**Milestone:** 3 – AI Decision Engine

**Version:** v1.0

**Status:** Ready for Engineering

---

# Purpose

This document is the entry point for implementing Milestone 3.

Read this document **before** reading any other implementation document.

Its purpose is to identify:

* the implementation objective,
* the authoritative documents,
* the architectural constraints,
* the expected deliverables,
* and the stopping condition.

It is **not** an architecture document.

It is **not** a design document.

It is an implementation guide.

---

# Milestone Objective

Implement the complete **AI Decision Engine** for CityOps AI.

This milestone transforms the previously implemented infrastructure into an operational AI orchestration system capable of:

* receiving structured perception,
* reasoning over uncertainty,
* planning evidence collection,
* coordinating evidence gathering,
* evaluating confidence,
* producing a municipality-ready recommendation.

No frontend or persistence work belongs to this milestone.

---

# Required Reading Order

Read the following documents in order.

```
IMPLEMENTATION_CONTEXT.md

↓

Milestone3.md

↓

01_AI_Infrastructure.md

↓

02_Decision_Engine.md

↓

03_Tool_Registry.md

↓

04_Confidence_Engine.md

↓

05_Runtime_Integration.md
```

Do not skip documents.

Implement the phases sequentially.

---

# Architecture References

Only the following specification chapters are authoritative for this milestone.

## Mandatory

* Chapter 2 – System Architecture
* Chapter 4 – API Specification
* Chapter 5 – AI Decision Engine Specification

## Reference Only

* PROJECT_STATUS.md

Do **not** consult unrelated chapters unless implementation reveals a genuine contradiction.

---

# Locked Architectural Decisions

The following decisions are permanently frozen.

Do **not** modify them.

### Product Identity

CityOps AI is an AI-powered Municipal Decision Engine.

It is **not** a complaint portal or chatbot.

---

### Runtime

Maintain the approved execution sequence:

```
Vision

↓

Decision Engine

↓

Tool Registry

↓

Confidence Engine

↓

Structured Recommendation
```

---

### Tool Registry

The Decision Engine never executes tools directly.

All external interactions occur through the Tool Registry.

---

### Confidence

Confidence is calculated only by the Confidence Engine.

The Decision Engine must never assign confidence values.

---

### Runtime Limits

Preserve:

* bounded reasoning,
* deterministic execution,
* maximum three tool invocations,
* graceful degradation.

---

### Google Cloud Stack

Preserve the approved technology stack.

Do not replace or introduce alternative cloud services or AI providers.

---

# Scope

Implement only:

* AI Infrastructure
* Decision Engine
* Tool Registry
* Confidence Engine
* Runtime Integration

---

# Explicitly Out of Scope

Do not implement:

* Firestore persistence
* Dashboard functionality
* Citizen UI
* Human Review interface
* Report upload workflow
* Work Orders
* Deployment changes
* New APIs beyond approved contracts

---

# Deliverables

Upon completion, the following components shall exist.

* Gemini Wrapper
* AI Service
* Prompt Management
* Decision Engine
* Tool Registry
* Confidence Engine
* Runtime Coordinator
* Structured AI Contracts
* AI Logging
* Runtime Metrics

---

# Success Criteria

Milestone 3 is complete when:

* every implementation phase has been completed,
* every acceptance criterion has passed,
* no architectural deviations exist,
* all tests pass,
* the AI runtime executes according to the approved architecture.

---

# Stop Condition

When implementation is complete:

Generate:

```
IMPLEMENTATION_REVIEW_PACKAGE.md
```

Save it to:

```
docs/
└── Reviews/
    └── Milestone3/
        └── IMPLEMENTATION_REVIEW_PACKAGE.md
```

Stop immediately.

Do **not** begin Milestone 4.

Wait for technical review and architectural approval before continuing.
