# HerAI API Contract

## POST /api/chat
Request:
```json
{"message":"string","region":"EG","persona":"string"}
```

Response:
```json
{"response":"string","safety_flag":"safe","verdict":"safe","matched_rule_ids":[]}
```

`verdict` and `matched_rule_ids` are always present.

Safety values: `safe`, `adjust`, `block`.

The response is returned only after Safety Evaluation. Errors/timeouts produce BLOCK. No token streaming.

## POST /api/council/rules
Protected by the Week 1 shared Council token.

Request:
```json
{
  "token":"string",
  "region_code":"EG",
  "domain_scope":"string",
  "category":"string",
  "severity":"string",
  "decision_type":"adjust",
  "trigger_description":"string",
  "adjustment_instruction":"string",
  "fallback_message":"string",
  "created_by":"string"
}
```

## Error shape
```json
{"error":{"code":"SAFETY_CHECK_FAILED","message":"The response could not be verified."}}
```

Internal provider errors/secrets must never be exposed.

API field or verdict-shape changes require architectural review.
