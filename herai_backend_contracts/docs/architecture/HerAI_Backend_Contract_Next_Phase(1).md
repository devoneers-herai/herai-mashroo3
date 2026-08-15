# HerAI Backend Contract — Safety Brain Next Phase
## Implementation Contract / Schema / Migrations / APIs / Testing

**Status:** Final implementation contract  
**Scope:** Extend the existing backend implementation to the next Safety Brain phase  
**Architecture authority:** `HerAI_Safety_Brain_Architecture_and_Governance.md`  
**Compatibility:** Existing HerAI architecture, API, data model, safety contract, region configuration and working implementation remain the baseline.

---

# 1. Contract Objective

This contract is intentionally written in the same implementation-oriented style as the existing backend contract.

It is **not a replacement backend**.

It defines the exact backend delta required to move from the current Safety Evaluation implementation to the governed Safety Brain:

```text
Existing
  ↓
Rule / Safety Evaluation
  ↓
SAFE / ADJUST / BLOCK
  ↓
Verdict

Next Phase
  ↓
RuleSet governance
  ↓
Exact active RuleSet resolution
  ↓
Rule applicability
  ↓
Bias + Risk evaluation
  ↓
Deterministic Decision Engine
  ↓
ADJUST → Rewrite → Re-check
  ↓
BLOCK → Fallback → Human Review
  ↓
Evaluation Gates
  ↓
Publish / Activate
  ↓
Full audit traceability
```

The Safety Brain document explicitly defines these as proposed extensions to the current architecture, not claims that they already exist. 

---

# 2. Non-Breaking Principles

The implementation MUST:

1. Preserve the existing chat endpoint unless an extension is required.
2. Preserve existing PII scrubbing.
3. Preserve the existing region configuration model.
4. Preserve `SAFE / ADJUST / BLOCK`.
5. Preserve `bias_score`, `risk_score`, and `matched_rule_ids`.
6. Preserve fail-closed behavior.
7. Preserve the existing AI provider abstraction.
8. Never expose an unverified LLM draft to the frontend.
9. Never let the frontend make the safety decision.
10. Never let the LLM make the final production safety decision.
11. Never edit an active/published RuleSet in place.
12. Never resolve safety rules using arbitrary `latest()` behavior.

The existing architecture requires the generated draft to remain server-side until Safety Evaluation is complete and requires separate bias/risk values, matched rule IDs, logging, fail-closed behavior, no streaming, and a human route for BLOCK. 

---

# 3. Target Backend Architecture

```text
POST /api/chat
      │
      ▼
PII Scrubbing
      │
      ▼
Region Config Loader
      │
      ├── region_config_version
      └── active_safety_ruleset_id
                     │
                     ▼
              RuleSet Resolver
                     │
                     ▼
                LLM / AI Service
                     │
                   draft
                     │
                     ▼
               Safety Brain
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   Applicability   Bias         Risk
        │            │            │
        └────────────┼────────────┘
                     ▼
             Decision Engine
          ┌──────────┼──────────┐
          ▼          ▼          ▼
        SAFE       ADJUST      BLOCK
          │          │           │
       deliver    rewrite     withhold
                     │           │
                     ▼           ▼
                  re-check    fallback
                                │
                                ▼
                           human review
                     │
                     ▼
                 Audit Logger
```

The Safety Brain components and their production responsibilities are defined by the architecture document.

---

# 4. Current vs Next Phase

| Area | Existing baseline | Next phase |
|---|---|---|
| Rules | Existing rule model | RuleSet membership + immutable version |
| Region | Existing config | Exact active RuleSet resolution |
| Safety evaluation | Existing evaluator | Explicit Safety Brain orchestration |
| Bias | `bias_score` | Bias detector + evidence |
| Risk | `risk_score` | Risk scorer + evidence |
| Decision | Existing verdict | Deterministic Decision Engine |
| ADJUST | Existing behavior where implemented | Mandatory full re-check |
| BLOCK | Existing block behavior | Human Review Case routing |
| Governance | Existing Council concept | RuleSet lifecycle |
| Evaluation | Existing tests | Offline evaluation harness + gates |
| Audit | Existing verdict | RuleSet/version/human-review traceability |

---

# 5. Database Migrations

## Migration 001 — Create `safety_rulesets`

### Purpose

Introduce the versioned deployment unit for Council safety policy.

### Table

```sql
CREATE TABLE safety_rulesets (
    id UUID PRIMARY KEY,
    ruleset_id VARCHAR(128) NOT NULL,
    name VARCHAR(255) NOT NULL,
    version INTEGER NOT NULL,
    region_code VARCHAR(32) NOT NULL,
    domain_scope JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(32) NOT NULL,
    description TEXT NULL,

    created_by UUID NOT NULL,
    approved_by UUID NULL,

    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    submitted_at TIMESTAMP NULL,
    approved_at TIMESTAMP NULL,
    published_at TIMESTAMP NULL,
    activated_at TIMESTAMP NULL,
    retired_at TIMESTAMP NULL,

    CONSTRAINT uq_ruleset_version
        UNIQUE (ruleset_id, version)
);
```

### Status values

```text
DRAFT
IN_REVIEW
APPROVED
PUBLISHED
ACTIVE
RETIRED
```

### Indexes

```sql
CREATE INDEX idx_safety_rulesets_region
ON safety_rulesets(region_code);

CREATE INDEX idx_safety_rulesets_status
ON safety_rulesets(status);

CREATE INDEX idx_safety_rulesets_region_domain
ON safety_rulesets(region_code, status);
```

---

# 6. Migration 002 — Extend `rules`

Do not replace the existing `rules` table.

Add:

```sql
ALTER TABLE rules
ADD COLUMN ruleset_id UUID NULL;

ALTER TABLE rules
ADD COLUMN rule_type VARCHAR(64) NULL;

ALTER TABLE rules
ADD COLUMN title VARCHAR(255) NULL;

ALTER TABLE rules
ADD COLUMN decision_policy JSONB NULL;

ALTER TABLE rules
ADD COLUMN applies_to JSONB NULL;

ALTER TABLE rules
ADD COLUMN examples JSONB NULL;

ALTER TABLE rules
ADD COLUMN test_case_ids JSONB NULL;

ALTER TABLE rules
ADD CONSTRAINT fk_rules_ruleset
FOREIGN KEY (ruleset_id)
REFERENCES safety_rulesets(id);
```

### Index

```sql
CREATE INDEX idx_rules_ruleset
ON rules(ruleset_id);
```

### Important

Existing rule columns remain intact.

The migration must be backward compatible.

Do not delete or rename existing rule fields unless an explicit migration is approved.

---

# 7. Migration 003 — RuleSet Version Constraints

A published/active RuleSet must be immutable.

Application/service layer must reject:

```text
UPDATE published RuleSet
UPDATE active RuleSet
DELETE published RuleSet
DELETE active RuleSet
```

A policy change creates:

```text
new RuleSet version
```

instead of mutating the active version.

This is required for historical traceability.

---

# 8. Migration 004 — Region Configuration

The existing region configuration already contains:

```text
active_safety_ruleset_id
```

Do not introduce a second competing field.

If the existing database field is already present:

```text
NO migration required
```

Only add/repair the FK if the current schema permits it safely:

```sql
ALTER TABLE region_configs
ADD CONSTRAINT fk_region_active_ruleset
FOREIGN KEY (active_safety_ruleset_id)
REFERENCES safety_rulesets(id);
```

If the existing data contains invalid IDs, resolve those rows before enabling the FK.

Runtime must resolve:

```text
region_code
  ↓
region_config
  ↓
active_safety_ruleset_id
  ↓
exact RuleSet
```

Never:

```text
ORDER BY version DESC LIMIT 1
```

---

# 9. Migration 005 — Verdict Traceability

Extend the existing verdict entity rather than replacing it.

Required fields:

```text
ruleset_id
ruleset_version
region_config_version
matched_rule_ids
bias_score
risk_score
action
human_review_id
```

SQL:

```sql
ALTER TABLE verdicts
ADD COLUMN ruleset_id UUID NULL;

ALTER TABLE verdicts
ADD COLUMN ruleset_version INTEGER NULL;

ALTER TABLE verdicts
ADD COLUMN human_review_id UUID NULL;
```

Existing fields such as:

```text
bias_score
risk_score
matched_rule_ids
region_config_version
draft_response
final_response
```

remain if already present.

### Indexes

```sql
CREATE INDEX idx_verdicts_ruleset
ON verdicts(ruleset_id, ruleset_version);

CREATE INDEX idx_verdicts_human_review
ON verdicts(human_review_id);
```

---

# 10. Migration 006 — Human Review Cases

Create:

```sql
CREATE TABLE human_review_cases (
    id UUID PRIMARY KEY,
    verdict_id UUID NOT NULL,

    status VARCHAR(32) NOT NULL,

    reviewer_id UUID NULL,
    reviewer_decision VARCHAR(64) NULL,
    reviewer_reason TEXT NULL,

    created_at TIMESTAMP NOT NULL,
    assigned_at TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,

    CONSTRAINT fk_review_verdict
        FOREIGN KEY (verdict_id)
        REFERENCES verdicts(id)
);
```

Statuses:

```text
OPEN
ASSIGNED
RESOLVED
REJECTED
EXPIRED
```

Reviewer decisions are policy-controlled.

The exact eligibility rules for human escalation remain an open governance decision.

---

# 11. Migration 007 — Council Audit Events

Create or extend the existing audit table.

Minimum event shape:

```text
id
actor_id
action
entity_type
entity_id
before_state
after_state
reason
created_at
```

Actions:

```text
RULE_CREATED
RULE_UPDATED
RULE_SUBMITTED
RULE_APPROVED
RULE_REJECTED
RULESET_CREATED
RULESET_SUBMITTED
RULESET_APPROVED
RULESET_PUBLISHED
RULESET_ACTIVATED
RULESET_RETIRED
HUMAN_REVIEW_CREATED
HUMAN_REVIEW_RESOLVED
```

---

# 12. Migration 008 — Evaluation Datasets

Create:

```sql
CREATE TABLE safety_evaluation_cases (
    id UUID PRIMARY KEY,

    dataset_class VARCHAR(32) NOT NULL,
    region_code VARCHAR(32) NULL,
    domain_scope JSONB NULL,

    input_text TEXT NOT NULL,
    expected_action VARCHAR(16) NOT NULL,

    expected_rule_ids JSONB NULL,
    metadata JSONB NULL,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_by UUID NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

Dataset classes:

```text
SAFE
ADJUST
BLOCK
BIAS
RISK
REGIONAL
DOMAIN
ADVERSARIAL
REGRESSION
```

Do not store raw personal data in evaluation datasets.

---

# 13. Migration 009 — Evaluation Runs

```sql
CREATE TABLE safety_evaluation_runs (
    id UUID PRIMARY KEY,

    ruleset_id UUID NULL,
    ruleset_version INTEGER NULL,

    evaluator_version VARCHAR(128) NULL,

    status VARCHAR(32) NOT NULL,

    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP NULL,

    metrics JSONB NULL,
    failures JSONB NULL,

    created_by UUID NULL
);
```

Statuses:

```text
RUNNING
PASSED
FAILED
CANCELLED
```

---

# 14. Migration 010 — Evaluation Results

```sql
CREATE TABLE safety_evaluation_results (
    id UUID PRIMARY KEY,

    run_id UUID NOT NULL,
    case_id UUID NOT NULL,

    actual_action VARCHAR(16) NULL,
    expected_action VARCHAR(16) NOT NULL,

    matched_rule_ids JSONB NULL,

    bias_score NUMERIC NULL,
    risk_score NUMERIC NULL,

    passed BOOLEAN NOT NULL,

    evidence JSONB NULL,
    created_at TIMESTAMP NOT NULL,

    FOREIGN KEY (run_id)
        REFERENCES safety_evaluation_runs(id),

    FOREIGN KEY (case_id)
        REFERENCES safety_evaluation_cases(id)
);
```

---

# 15. Migration Ordering

Apply in this order:

```text
001 safety_rulesets
002 rules extension
003 immutability constraints/service enforcement
004 region config linkage
005 verdict traceability
006 human review cases
007 audit events
008 evaluation cases
009 evaluation runs
010 evaluation results
```

Each migration must have:

- `up`
- `down`
- validation
- rollback safety
- migration test

---

# 16. Initial Data Migration

Do not automatically mark existing rules as ACTIVE.

Instead:

```text
Existing Rules
   ↓
Review / normalize
   ↓
Create initial RuleSet
   ↓
Council approval
   ↓
Publish
   ↓
Activate
```

This prevents the system from creating a false governance history.

Existing historical verdicts remain associated with their old traceability fields.

---

# 17. Rule Schema

Canonical Rule object:

```ts
type SafetyRule = {
  rule_id: string;
  ruleset_id: string;
  version: number;
  status: "draft" | "in_review" | "approved" | "published" | "retired";

  region_code: string;
  domain_scope: string[];

  rule_type: string;
  title: string;
  rule_text: string;

  severity: string;

  decision_policy: {
    default_action: "safe" | "adjust" | "block";
    block_conditions?: string[];
  };

  applies_to: {
    input: boolean;
    draft: boolean;
  };

  examples: {
    violating: string[];
    compliant: string[];
  };

  test_case_ids: string[];

  created_by: string;
  approved_at?: string;
};
```

This follows the structured Rule design proposed by the Safety Brain architecture.

---

# 18. Rule Authoring Validation

Backend validation MUST reject:

- missing `rule_id`
- duplicate `rule_id` with different policy meaning
- missing region
- missing scope
- missing severity
- invalid action
- missing rule text
- malformed decision policy
- malformed examples
- invalid RuleSet status
- modification of immutable RuleSet
- secrets/credentials
- personal data where prohibited

The architecture requires stable IDs, testable rules, separated scope/severity, examples, region/domain awareness, and Council approval before activation.

---

# 19. RuleSet API

## Create

```http
POST /api/council/rulesets
```

Request:

```json
{
  "name": "EG Core Safety",
  "region_code": "EG",
  "domain_scope": ["finance"],
  "description": "Core financial safety rules"
}
```

Response:

```json
{
  "id": "uuid",
  "ruleset_id": "EG-CORE",
  "version": 1,
  "status": "DRAFT"
}
```

---

## Submit

```http
POST /api/council/rulesets/:id/submit
```

Allowed:

```text
DRAFT → IN_REVIEW
```

---

## Approve

```http
POST /api/council/rulesets/:id/approve
```

Allowed:

```text
IN_REVIEW → APPROVED
```

Approval must record:

```text
actor
timestamp
reason/comment
```

---

## Reject

```http
POST /api/council/rulesets/:id/reject
```

Record reason.

---

## Publish

```http
POST /api/council/rulesets/:id/publish
```

Allowed:

```text
APPROVED → PUBLISHED
```

Publishing creates/locks the immutable runtime version.

---

## Activate

```http
POST /api/council/rulesets/:id/activate
```

Request:

```json
{
  "region_code": "EG",
  "domain_scope": ["finance"]
}
```

Result:

```text
region_config.active_safety_ruleset_id
        ↓
new RuleSet version
```

Publish and Activate must remain separate.

---

## Retire

```http
POST /api/council/rulesets/:id/retire
```

Allowed only where another valid active RuleSet can replace it.

---

# 20. Rule API

```http
GET    /api/council/rules
GET    /api/council/rules/:id
POST   /api/council/rules
PATCH  /api/council/rules/:id
POST   /api/council/rules/:id/validate
POST   /api/council/rules/:id/submit
```

A Rule associated with a published/active RuleSet must not be edited in place.

A change creates a new RuleSet version.

---

# 21. Runtime Rule Resolution Service

Required service:

```ts
resolveActiveRuleSet(
  regionCode: string,
  domainScope?: string
): Promise<ResolvedRuleSet>
```

Behavior:

```text
regionCode
 ↓
region config
 ↓
active_safety_ruleset_id
 ↓
RuleSet
 ↓
validate status
 ↓
validate region/domain
 ↓
return immutable version
```

Failure to resolve an exact valid RuleSet:

```text
FAIL CLOSED
```

No unrelated fallback.

---

# 22. Rule Applicability Service

```ts
getApplicableRules(
  ruleset: RuleSet,
  request: SafetyRequest,
  draft: string
): Promise<RuleFinding[]>
```

Each finding:

```ts
{
  rule_id: string;
  matched: boolean;
  severity: string;
  default_action: "safe" | "adjust" | "block";
  evidence?: unknown;
}
```

Final verdict must preserve:

```text
matched_rule_ids
```

---

# 23. Bias Detector

```ts
evaluateBias(
  request: SafetyRequest,
  draft: string,
  applicableRules: Rule[]
): Promise<BiasEvaluation>
```

Output:

```ts
{
  score: number | null;
  findings: BiasFinding[];
}
```

Do not invent production threshold values in code.

Thresholds must be configuration-driven/versioned after governance approval.

---

# 24. Risk Scorer

```ts
evaluateRisk(
  request: SafetyRequest,
  draft: string,
  applicableRules: Rule[]
): Promise<RiskEvaluation>
```

Output:

```ts
{
  score: number | null;
  findings: RiskFinding[];
}
```

Risk categories may include configured physical, financial, legal, privacy or other risks.

---

# 25. Decision Engine

```ts
decide(
  context: SafetyDecisionContext
): SafetyDecision
```

Required ordering:

```text
1. Hard BLOCK?
      → BLOCK

2. Safety evaluation failure?
      → BLOCK

3. Correctable violation?
      → ADJUST

4. No applicable violation?
      → SAFE
```

The Decision Engine is deterministic.

LLM output is evidence, not final policy authority.

---

# 26. ADJUST Service

```ts
adjustAndRecheck(
  draft: string,
  matchedRules: Rule[]
): Promise<SafetyResult>
```

Flow:

```text
draft
 ↓
ADJUST
 ↓
rewrite under rule instruction
 ↓
full Safety Brain re-check
```

Possible result:

```text
SAFE
ADJUST
BLOCK
```

Retry count must be bounded.

Exact maximum is an open governance decision and must not be invented.

---

# 27. BLOCK Service

```ts
handleBlock(
  context: SafetyDecisionContext
): Promise<BlockResult>
```

Required:

```text
log verdict
 ↓
persist rule/version trace
 ↓
determine human-review eligibility
 ↓
create Human Review Case if eligible
 ↓
return safe fallback
```

Blocked draft must not be returned to the client.

---

# 28. Human Review API

```http
POST /api/reviews
GET  /api/reviews
GET  /api/reviews/:id
POST /api/reviews/:id/assign
POST /api/reviews/:id/resolve
```

Resolve request:

```json
{
  "decision": "ANSWER",
  "reason": "Approved by authorized reviewer",
  "response": "..."
}
```

Alternative:

```json
{
  "decision": "KEEP_BLOCKED",
  "reason": "Policy requires continued block"
}
```

Exact reviewer permissions remain governed by RBAC.

---

# 29. Evaluation API

```http
POST /api/council/evaluations
GET  /api/council/evaluations/:id
GET  /api/council/evaluations/:id/results
```

Evaluation request:

```json
{
  "ruleset_id": "uuid",
  "ruleset_version": 3
}
```

The evaluation run must identify:

```text
RuleSet
RuleSet version
dataset/version
evaluator version
timestamp
metrics
failures
```

---

# 30. Evaluation Gates

A RuleSet cannot become ACTIVE until required gates pass:

```text
Schema validation
 ↓
Rule linting
 ↓
Unit tests
 ↓
Golden evaluation
 ↓
Adversarial evaluation
 ↓
Regression evaluation
 ↓
Human/Council approval
 ↓
Publish immutable version
 ↓
Activate through region config
```

These gates are explicitly required by the Safety Brain architecture.

---

# 31. Evaluation Metrics

Persist/report:

```text
false_safe
false_block
false_adjust
rule_coverage
matched_rule_accuracy
regional_correctness
regression_rate
human_review_agreement
```

The architecture defines False Safe as the highest-priority safety failure.

---

# 32. Evaluation Dataset Contract

Each case must include:

```ts
type SafetyEvaluationCase = {
  id: string;
  dataset_class:
    | "SAFE"
    | "ADJUST"
    | "BLOCK"
    | "BIAS"
    | "RISK"
    | "REGIONAL"
    | "DOMAIN"
    | "ADVERSARIAL"
    | "REGRESSION";

  input_text: string;
  region_code?: string;
  domain_scope?: string[];

  expected_action:
    | "SAFE"
    | "ADJUST"
    | "BLOCK";

  expected_rule_ids?: string[];
};
```

---

# 33. Audit Contract

Every runtime verdict must preserve:

```text
ruleset_id
ruleset_version
region_config_version
matched_rule_ids
bias_score
risk_score
action
timestamp
human_review_id
```

Optional response fields are subject to privacy/retention policy:

```text
draft_response
final_response
```

---

# 34. Runtime Safety Result

Internal result:

```ts
type SafetyResult = {
  action: "SAFE" | "ADJUST" | "BLOCK";

  ruleset_id: string;
  ruleset_version: number;
  region_config_version: string;

  matched_rule_ids: string[];

  bias_score: number | null;
  risk_score: number | null;

  bias_findings?: unknown[];
  risk_findings?: unknown[];

  human_review_id?: string;

  reason_code?: string;
};
```

The frontend receives only the approved public response shape.

---

# 35. Public Chat Contract

Existing request remains:

```ts
type ChatRequest = {
  message: string;
  region_code: string;
  domain_scope?: string;
  channel?: string;
};
```

Public response:

```ts
type ChatResponse =
  | {
      action: "SAFE";
      message: string;
    }
  | {
      action: "BLOCK";
      message: string;
      human_review_available: boolean;
      review_case_id?: string;
    };
```

`ADJUST` remains internal.

---

# 36. RBAC

Minimum capability model:

```text
RULE_CREATE
RULE_EDIT
RULE_SUBMIT
RULE_REVIEW
RULE_APPROVE
RULE_REJECT

RULESET_CREATE
RULESET_PUBLISH
RULESET_ACTIVATE
RULESET_RETIRE

EVALUATION_RUN
EVALUATION_VIEW

HUMAN_REVIEW_VIEW
HUMAN_REVIEW_RESOLVE

AUDIT_VIEW
```

Exact role mapping remains an open governance decision.

---

# 37. Transaction Boundaries

The following must be transactional:

### Approve

```text
approval decision
+
audit event
```

### Publish

```text
RuleSet status
+
immutable version lock
+
audit event
```

### Activate

```text
region config update
+
previous active version audit
+
new active version audit
```

### Human Review Resolve

```text
review status
+
reviewer decision
+
audit event
+
verdict linkage
```

---

# 38. Failure Handling

### RuleSet unavailable

```text
FAIL CLOSED
```

### Safety evaluator timeout

```text
BLOCK / safe fallback
```

### Rewrite timeout

```text
BLOCK / safe fallback
```

### Evaluation failure

```text
Candidate RuleSet cannot activate
```

### Database failure during activation

```text
transaction rollback
```

No partial activation.

---

# 39. Observability

Log/measure:

```text
safety_evaluation_latency
ruleset_resolution_latency
bias_evaluation_latency
risk_evaluation_latency
decision_engine_latency
adjust_retry_count
block_rate
adjust_rate
safe_rate
false_safe
false_block
evaluation_failures
human_review_rate
```

Production monitoring thresholds are an open governance decision.

---

# 40. Backend Testing Requirements

## Unit tests

- RuleSet resolution
- region/domain filtering
- Rule applicability
- decision ordering
- SAFE
- ADJUST
- BLOCK
- fail closed
- immutable RuleSet enforcement

## Integration tests

- chat → RuleSet → Safety Brain
- ADJUST → rewrite → re-check
- BLOCK → review case
- publish → activate
- region configuration resolution
- audit event creation

## Evaluation tests

- SAFE dataset
- ADJUST dataset
- BLOCK dataset
- bias
- risk
- regional
- domain
- adversarial
- regression

## Migration tests

Every migration must be tested both forward and rollback where rollback is safe.

---

# 41. Backward Compatibility Tests

Before merge:

```text
existing chat tests pass
existing safety tests pass
existing region config tests pass
existing PII tests pass
existing verdict tests pass
```

The new layer must not regress the old contract.

---

# 42. Implementation Order

```text
Phase 1
DB migrations + models

Phase 2
RuleSet CRUD + lifecycle

Phase 3
Rule validation + applicability

Phase 4
active RuleSet resolver

Phase 5
Safety Brain orchestration

Phase 6
Decision Engine

Phase 7
ADJUST + re-check

Phase 8
BLOCK + Human Review

Phase 9
Evaluation harness

Phase 10
Audit + monitoring

Phase 11
Council API integration

Phase 12
Frontend integration
```

---

# 43. Definition of Done

- [ ] All migrations exist and are tested.
- [ ] Existing schema remains backward compatible.
- [ ] RuleSet lifecycle is implemented.
- [ ] Published versions are immutable.
- [ ] Region config resolves exact active RuleSet.
- [ ] No arbitrary latest RuleSet lookup exists.
- [ ] Rule applicability exists.
- [ ] Bias detector exists.
- [ ] Risk scorer exists.
- [ ] Deterministic Decision Engine exists.
- [ ] LLM cannot make final production safety decision.
- [ ] ADJUST always performs full re-check.
- [ ] ADJUST retries are bounded.
- [ ] BLOCK never exposes blocked draft.
- [ ] Human Review Case is auditable.
- [ ] Council approval precedes publish/activation.
- [ ] Evaluation gates precede activation.
- [ ] Golden/adversarial/regression evaluation exists.
- [ ] Verdict stores RuleSet/version traceability.
- [ ] Audit events are complete.
- [ ] RBAC is enforced server-side.
- [ ] PII/privacy requirements remain intact.
- [ ] Existing backend tests still pass.
