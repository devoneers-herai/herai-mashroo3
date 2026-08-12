# HerAI Safety Contract

## 1. Purpose

The Safety Contract defines how generated AI responses are evaluated
before they can be delivered to the user.

The generated draft must remain on the server until the Safety Evaluation
is complete.

---

## 2. Safety Pipeline

```text
User Request
     ↓
Generate Draft
     ↓
Safety Evaluation
     ↓
Decision
 ┌──────┼────────┐
 ↓      ↓        ↓
SAFE   ADJUST   BLOCK
 ↓      ↓        ↓
Deliver Rewrite  Withhold
        ↓
     Re-check
        ↓
     Decision
```

---

## 3. Safety Evaluation

The Safety Evaluation is performed after the AI generates a draft.

The evaluation produces a structured result:

```json
{
  "bias_score": 0.0,
  "risk_score": 0.0,
  "action": "safe",
  "matched_rule_ids": []
}
```

### Fields

| Field | Type | Description |
|---|---|---|
| `bias_score` | float | Score produced by the Bias Detector |
| `risk_score` | float | Score produced by the Risk Scorer |
| `action` | string | Safety action: `safe`, `adjust`, or `block` |
| `matched_rule_ids` | array | IDs of rules that affected the evaluation |

---

## 4. Two Evaluators

The system uses two separate evaluation concepts:

### Bias Detector

Evaluates the generated response for bias-related concerns.

### Risk Scorer

Evaluates the generated response for risk-related concerns.

The two scores must remain separate even if they are produced through
one API call during the initial implementation.

---

## 5. Safety Actions

### SAFE

The generated response passes the Safety Evaluation.

```text
action = safe
     ↓
Deliver response
```

---

### ADJUST

The generated response requires modification under the applicable rule.

```text
action = adjust
     ↓
Rewrite under the rule instruction
     ↓
Re-check Safety
```

The adjusted response must pass the Safety Evaluation before delivery.

---

### BLOCK

The generated response must not be delivered.

```text
action = block
     ↓
Withhold generated response
     ↓
Return fallback response
     ↓
Log verdict
```

The fallback response must not expose the blocked draft.

---

## 6. Safety Failure

If the Safety Evaluation fails or times out:

```text
Safety Evaluation
       ↓
   Error / Timeout
       ↓
      BLOCK
       ↓
Do not deliver the draft
```

The system must fail closed.

An unavailable Safety Evaluation must never be treated as a SAFE result.

---

## 7. Server-Side Safety Boundary

The generated draft must remain on the server during evaluation.

```text
AI Draft
   ↓
Server-side Safety Evaluation
   ↓
Final Decision
   ↓
Response to Client
```

The frontend must never receive the unverified draft.

---

## 8. Verdict Logging

A verdict record must be written for every exchange.

This includes:

- SAFE
- ADJUST
- BLOCK

The verdict record must preserve the information required to understand
the decision.

At minimum:

```text
bias_score
risk_score
action
matched_rule_ids
region_config_version
draft_response
final_response
```

---

## 9. Re-check Rule

When an action is `adjust`, the system rewrites the response under the
applicable rule instruction and performs one additional Safety Evaluation.

The rewritten response must not bypass the Safety Evaluation.

---

## 10. No Streaming

The chat response must not use token streaming.

The user receives the response only after the complete response has been
generated and safety-checked.

The interface should communicate that the response is being checked.

Example:

```text
Checking this answer...
```

---

## 11. Block Experience

A BLOCK must not be a dead-end refusal.

The blocked response should provide a route to a person and offer a way
to send the question to that person.

---

## 12. Architectural Rules

1. Generate first, evaluate second, deliver last.
2. The generated draft remains server-side until evaluated.
3. Bias and risk scores remain separate.
4. SAFE, ADJUST, and BLOCK are distinct actions.
5. ADJUST requires a rewrite followed by a re-check.
6. Safety failure or timeout results in BLOCK.
7. Every verdict is logged, including SAFE.
8. The frontend never receives an unverified draft.
9. Token streaming is not allowed for the chat response.
10. A BLOCK response provides a route to human assistance.
