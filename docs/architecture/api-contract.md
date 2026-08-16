# HerAI API Contract

## 1. Purpose

This document defines the communication contract between the frontend
and backend services.

The contract specifies:

- Request structure
- Response structure
- Safety verdicts
- Error behavior
- Region configuration
- Channel identification

The goal is to allow frontend and backend development to proceed
independently while maintaining a shared interface.

---

## 2. Chat Endpoint

### Endpoint

```http
POST /api/chat
```

### Purpose

Receives a user message and returns a safety-checked response.

---

## 3. Request

### Request Body

```json
{
  "message": "string",
  "region_code": "string",
  "domain_scope": "string",
  "channel": "web"
}
```

### Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| `message` | string | Yes | User's message |
| `region_code` | string | Yes | Region used for runtime configuration |
| `domain_scope` | string | Yes | Domain of the request |
| `channel` | string | Yes | Channel through which the request was received |

### Supported Channel Values

For the initial implementation:

```text
web
```

Future channels may include:

```text
whatsapp
sms
voice
```

---

## 4. Request Processing

The backend processes the request through the following pipeline:

```text
Receive
  ↓
PII Scrub
  ↓
Load Region Config
  ↓
Generate Draft
  ↓
Safety Evaluation
  ↓
Decision
  ↓
Log Verdict
  ↓
Respond
```

The generated draft must not be delivered before the safety evaluation.

---

## 5. Response

### Successful Response

```json
{
  "response": "string",
  "safety_flag": "string",
  "verdict": "safe",
  "matched_rule_ids": []
}
```

### Response Fields

| Field | Type | Description |
|---|---|---|
| `response` | string | Final response delivered to the user |
| `safety_flag` | string | Safety status information |
| `verdict` | string | Safety decision |
| `matched_rule_ids` | array | Rules that affected the decision |

---

## 6. Safety Verdicts

The system supports three main verdicts:

### SAFE

The generated response satisfies the active safety rules.

```text
SAFE
→ Deliver response
```

### ADJUST

The generated response violates or conflicts with a rule that can be
corrected.

```text
ADJUST
→ Rewrite under the relevant rule
→ Re-check safety
→ Deliver only if the new response passes
```

### BLOCK

The generated response must not be delivered.

```text
BLOCK
→ Withhold response
→ Log the verdict
```

---

## 7. Safety Failure

If the Safety Evaluation fails or times out:

```text
Safety Evaluation Error
        ↓
      BLOCK
        ↓
Do not deliver the unverified draft
```

The system must fail closed rather than delivering an unverified response.

---

## 8. Error Response

Example:

```json
{
  "error": {
    "code": "SAFETY_CHECK_FAILED",
    "message": "The response could not be safely verified."
  }
}
```

The backend must never return the unverified draft as a fallback.

---

## 9. Channel Independence

The channel identifies where the request originated.

The core advisory and safety pipeline remains independent from the channel.

```text
Web
 ↓
      ┌──────────────────────┐
WhatsApp ─→ Backend Chat API │
      │                      │
SMS ─────→ Core Pipeline     │
      │                      │
Voice ────→ Core Pipeline    │
      └──────────────────────┘
```

This allows additional channels to be added without duplicating the
core business and safety logic.

---

## 10. Architecture Rules

1. The frontend must communicate through the backend API.
2. The frontend must never call the AI provider directly.
3. The generated draft must not reach the browser before safety evaluation.
4. Safety evaluation failure results in BLOCK.
5. The final response must be returned only after safety evaluation.
6. All AI provider access must go through `ai.service.ts`.
7. PII must be scrubbed before database persistence.

---

## 11. Contract Ownership

The API contract is an architectural contract.

Any change to the request or response schema must be reviewed before
implementation.

Frontend and backend implementations must conform to this contract.
