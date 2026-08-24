# HerAI Data Model

## rules
| Field | Type |
|---|---|
| rule_id | text PK |
| version | integer |
| status | enum |
| region_code | text |
| domain_scope | text |
| category | text |
| severity | text |
| decision_type | adjust/block |
| trigger_description | text |
| adjustment_instruction | text |
| fallback_message | text |
| created_by | text |
| embedding | vector(1536), nullable |
| created_at | timestamptz |

## conversations
| Field | Type |
|---|---|
| id | UUID PK |
| region_code | text |
| region_config_version | text |
| domain_scope | text |
| scrubbed_message | text |
| created_at | timestamptz |

Raw user input must not be persisted.

## verdicts
| Field | Type |
|---|---|
| id | UUID PK |
| conversation_id | UUID FK |
| action | safe/adjust/block |
| bias_score | double precision |
| risk_score | double precision |
| matched_rule_ids | text[] |
| region_config_version | text |
| draft_response | text |
| final_response | text |
| created_at | timestamptz |

Every exchange creates a verdict row, including SAFE.

## council_decisions
| Field | Type |
|---|---|
| id | UUID PK |
| decision_type | text |
| decision_content | text |
| created_by | text |
| timestamp | timestamptz |
| rationale | text |
| version | text |

Relationship:
`conversations 1 -> many verdicts`.

Rules are referenced by verdicts through `matched_rule_ids`.
