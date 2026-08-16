# HerAI Architecture Rules

## 1. Purpose

These rules define the non-negotiable architectural constraints that all
implementation work must follow.

The purpose is to keep the system safe, auditable, region-aware, and
independent from a specific AI provider.

---

## 2. AI Provider Access

All AI provider access must go through the centralized AI service.

```text
Application
     ↓
ai.service.ts
     ↓
AI Provider
```

No other service may call the provider SDK directly.

This creates a single integration boundary between the application and
the AI provider.

---

## 3. AI Provider Independence

Business logic must not depend directly on a specific AI provider.

The application should communicate with the centralized AI service rather
than importing provider-specific SDKs throughout the codebase.

Changing the provider should require changes primarily inside the AI
service boundary.

---

## 4. PII Boundary

Personally Identifiable Information (PII) must be scrubbed before the
first database write.

```text
User Input
    ↓
PII Scrubber
    ↓
Scrubbed Data
    ↓
Database
```

Raw user text must not be persisted.

---

## 5. Server-Side Safety Boundary

Generated AI drafts must remain server-side until Safety Evaluation is
complete.

```text
Generate Draft
     ↓
Safety Evaluation
     ↓
Decision
     ↓
Client
```

The frontend must never receive an unverified draft.

---

## 6. Fail-Closed Safety

If the Safety Evaluation fails or times out, the system must BLOCK the
response.

```text
Safety Error
     ↓
BLOCK
```

The system must never treat an unavailable Safety Evaluation as SAFE.

---

## 7. Safety Verdicts

The system must support the following actions:

```text
SAFE
ADJUST
BLOCK
```

### SAFE

Deliver the verified response.

### ADJUST

Rewrite the response under the applicable rule and perform another
Safety Evaluation.

### BLOCK

Withhold the generated response and return the approved fallback
experience.

---

## 8. No Safety Bypass

No endpoint, service, or frontend flow may bypass the Safety Evaluation.

The following flow is prohibited:

```text
User
 ↓
Generate
 ↓
Frontend
```

The required flow is:

```text
User
 ↓
Generate
 ↓
Safety Evaluation
 ↓
Decision
 ↓
Frontend
```

---

## 9. No Token Streaming

The chat response must not use token streaming.

The complete response must be generated and Safety-checked before it is
returned to the client.

---

## 10. Region Configuration

Region-specific behavior must be driven by configuration whenever
possible.

The system must resolve the active region configuration at runtime.

```text
region_code
     ↓
region_config
     ↓
active configuration
```

The core application logic should remain shared across regions.

---

## 11. Configuration Versioning

The resolved region configuration version must be recorded with the
relevant conversation and Safety Verdict.

This allows the team to determine which configuration produced a
historical decision.

---

## 12. Safety Scores

Bias and risk must remain separate values.

```text
bias_score
risk_score
```

They must not be replaced by a single combined safety score.

---

## 13. Verdict Logging

Every Safety Verdict must be logged.

This includes:

```text
SAFE
ADJUST
BLOCK
```

The system must preserve the information required to understand the
decision, including:

- action
- bias_score
- risk_score
- matched_rule_ids
- region_config_version
- draft_response
- final_response
- timestamp

---

## 14. Rule Traceability

Safety decisions must be traceable to the rules that affected them.

The system must record:

```text
matched_rule_ids
```

This allows the team to identify which rules influenced a decision.

---

## 15. Database Boundary

The frontend must never access the database directly.

```text
Frontend
   ↓
Backend
   ↓
Database
```

All database access must happen through backend services.

---

## 16. Secrets

Secrets and credentials must never be committed to the repository.

Examples include:

- API keys
- Database credentials
- Authentication secrets
- Provider credentials

Environment variables or the approved secret-management mechanism must
be used instead.

---

## 17. API Boundary

The frontend must communicate with the backend through the defined API
contract.

Frontend and backend implementations must conform to the documented
request and response schemas.

---

## 18. Channel Independence

Channels must remain separate from the core advisory and safety logic.

The channel identifies how the request entered the system.

The core processing pipeline should remain shared.

```text
Web       ─┐
WhatsApp  ─┤
SMS       ─┼──→ Core Backend Pipeline
Voice     ─┘
```

Adding a new channel must not require duplicating the core safety and
business logic.

---

## 19. Architecture Changes

Changes to an architectural contract must be reviewed before
implementation.

This includes changes to:

- API contracts
- Data models
- Region configuration
- Safety behavior
- AI provider integration
- Security boundaries

---

## 20. Pull Requests

Implementation changes must be submitted through Pull Requests.

A Pull Request should clearly describe:

- What changed
- Why it changed
- Which architectural component is affected
- How the change was tested

---

## 21. Main Branch Protection

The main branch must not be used as a direct development branch.

Changes should be reviewed and merged through the team's agreed
Pull Request workflow.

---

## 22. Rule Priority

When implementation decisions conflict with these architectural rules,
the architectural contract must be reviewed before bypassing or changing
the rule.

The goal is to preserve system safety, privacy, traceability, and
maintainability.
