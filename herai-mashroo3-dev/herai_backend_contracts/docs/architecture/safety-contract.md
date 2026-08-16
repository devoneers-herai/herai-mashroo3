# HerAI Safety Contract

```json
{
  "bias_score":0.0,
  "risk_score":0.0,
  "action":"safe",
  "matched_rule_ids":[]
}
```

Actions:
- `safe`: deliver checked draft.
- `adjust`: rewrite under the rule and re-check once.
- `block`: withhold draft and return fallback.

Safety error/timeout:
```text
Safety Evaluation
      ↓
Error / Timeout
      ↓
BLOCK
```

The client never receives an unverified draft.

Every exchange logs:
`bias_score`, `risk_score`, `action`, `matched_rule_ids`,
`region_config_version`, `draft_response`, `final_response`, timestamp.

No token streaming.
