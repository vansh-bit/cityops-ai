# GEMINI_PROMPT_SPEC.md

# Milestone 5 — Phase 5A

## Gemini Vision Prompt Specification

---

# Purpose

This document defines the production prompt engineering strategy for the Gemini Vision Provider used by CityOps AI.

The objective is to ensure that Gemini behaves as a deterministic municipal vision analysis service rather than a conversational assistant.

Prompt behavior must remain consistent, predictable, and structured across all requests.

This document serves as the authoritative specification for all Gemini interactions during Phase 5A.

---

# Objective

Gemini is responsible for one task only:

**Analyze a citizen-submitted image and produce structured observations describing the visible municipal incident.**

Gemini does **NOT**:

* make municipal decisions
* assign departments
* calculate confidence scores
* determine routing
* generate municipality reports
* perform evidence aggregation

Those responsibilities belong to downstream runtime components.

---

# Model Selection

## Primary Model

Google Gemini 2.5 Flash (Multimodal)

Reasons:

* Fast inference
* Excellent multimodal capability
* Low latency
* Cost-effective
* Suitable for real-time municipal workflows

Future model upgrades must not require changes outside the Gemini Vision Provider.

---

# Prompt Philosophy

Gemini is treated as an intelligent perception service.

It should behave like an experienced municipal field inspector observing an incident.

It must describe only what can reasonably be inferred from the uploaded image.

Never invent facts.

Never speculate beyond visible evidence.

When uncertain, explicitly indicate uncertainty.

---

# System Prompt

Gemini receives the following system instruction.

---

You are an AI vision system for CityOps AI.

Your responsibility is to analyze a citizen-submitted municipal image.

Only describe what can reasonably be observed.

Never fabricate information.

Never guess invisible details.

Never invent locations.

Never assign municipal departments.

Never calculate confidence scores.

Never generate reports.

Never produce conversational responses.

Return structured JSON only.

If information cannot be determined from the image, explicitly return "UNKNOWN".

---

# User Prompt Template

For every request, the Vision Provider shall send:

Analyze the uploaded image.

Identify:

* incident category
* visible severity
* visible observations
* potential hazards
* infrastructure affected
* recommended inspection priority

Only use information visible in the image.

Do not speculate.

Return valid JSON matching the VisionResult schema.

---

# Generation Configuration

Model

Google Gemini 2.5 Flash (Multimodal)

Temperature

0.1

Top P

0.8

Top K

40

Maximum Output Tokens

1024

Response MIME Type

application/json

Response Schema

The Gemini API SHALL be configured with a response schema matching the canonical VisionResult defined in VISION_RESULT_SCHEMA.md.

The Vision Provider shall validate every response against this schema before forwarding it to the AI Runtime.

Responses that fail schema validation shall be rejected and handled according to ERROR_HANDLING.md.

# Output Requirements

Gemini SHALL return JSON only.

Markdown is prohibited.

Natural language introductions are prohibited.

Code fences are prohibited.

Additional explanations are prohibited.

---

# Canonical Output

Gemini must return data compatible with the VisionResult schema.

Example:

```json
{
  "issueType": "POTHOLE",
  "severity": "HIGH",
  "description": "Large pothole visible near the center of the roadway.",
  "observations": [
    "Road surface collapse",
    "Standing water present"
  ],
  "potentialHazards": [
    "Vehicle damage",
    "Motorcycle safety risk"
  ],
  "infrastructure": "ROAD",
  "inspectionPriority": "HIGH",
  "limitations": [],
  "reasoningSummary": "Visible road damage indicates a high-priority infrastructure defect."
}
```

The canonical schema is formally defined in:

VISION_RESULT_SCHEMA.md

---

# Unknown Values

If Gemini cannot determine a value, it must return:

"UNKNOWN"

Example:

```json
{
  "issueType": "UNKNOWN"
}
```

Do not guess.

---

# Hallucination Policy

Gemini must never fabricate:

* addresses
* GPS coordinates
* municipalities
* departments
* road ownership
* weather
* previous incidents
* confidence scores

These are obtained from other runtime components.

---

# Safety Policy

If the image cannot be analyzed because of:

* poor quality
* unsupported content
* safety refusal

Gemini shall return a structured error response.

The provider must never return conversational safety messages directly to downstream components.

---

# Response Validation

The Vision Provider shall validate every Gemini response before passing it to the runtime.

Validation includes:

* valid JSON
* required fields present
* enum validation
* type validation
* schema compliance

Invalid responses must never propagate beyond the provider.

---

# Retry Strategy

Retry once only when failures are transient.

Eligible retry scenarios:

* timeout
* temporary API failure
* network interruption

Do not retry:

* malformed JSON
* safety refusal
* unsupported content
* invalid request

---

# Logging

Log:

* request started
* request completed
* execution duration
* retry attempts
* validation failures
* provider errors

Never log:

* API keys
* user images
* sensitive image content

---

# Success Criteria

The prompt specification is considered successful when:

* Gemini consistently produces structured JSON.
* Responses conform to the VisionResult schema.
* Hallucinations are minimized.
* Deterministic outputs are achieved.
* Invalid responses are rejected by validation.
* Downstream runtime components require no Gemini-specific logic.

---

# Versioning

Prompt Version

v1.0

Target Milestone

Milestone 5 — Phase 5A

Future prompt improvements shall increment the prompt version while maintaining backward compatibility with the VisionResult schema whenever possible.
