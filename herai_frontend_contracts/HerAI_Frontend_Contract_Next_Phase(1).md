# HerAI Frontend Contract — Safety Brain & Council Portal Next Phase
## Implementation Contract / Screens / Components / API Integration / State / RBAC

**Status:** Final implementation contract  
**Scope:** Extend the existing frontend implementation to integrate the next backend phase and implement the Council Portal.  
**Architecture authority:** `HerAI_Safety_Brain_Architecture_and_Governance.md`

---

# 1. Objective

The frontend has two responsibilities:

```text
1. User Chat
2. Council Portal
```

The frontend is a client of the backend.

It does NOT implement:

- Safety Brain logic
- Rule applicability
- bias/risk scoring
- SAFE/ADJUST/BLOCK decisions
- RuleSet resolution
- security authorization
- GPT calls

The architecture requires the unverified draft to remain server-side and the final safety action to be controlled by a deterministic backend policy layer.

---

# 2. Existing UI Baseline

Preserve the current:

- chat layout
- composer
- message rendering
- loading state
- responsive behavior
- design system
- TypeScript strictness
- existing build/lint configuration

Add the Council Portal without breaking the existing User Chat.

---

# 3. Application Structure

```text
app/
├── chat/
│   └── User Chat
│
└── council/
    ├── dashboard
    ├── rules
    ├── rulesets
    ├── reviews
    ├── evaluations
    ├── publish
    ├── activation
    └── audit
```

Recommended client architecture:

```text
pages/routes
   ↓
feature components
   ↓
hooks/state
   ↓
API adapters
   ↓
Backend
```

No component should call GPT/provider APIs directly.

---

# 4. User Chat API

Request:

```ts
type ChatRequest = {
  message: string;
  region_code: string;
  domain_scope?: string;
  channel?: string;
};
```

Response:

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

---

# 5. User Chat State

```ts
type ChatState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | {
      status: "blocked";
      message: string;
      human_review_available: boolean;
      review_case_id?: string;
    }
  | { status: "error"; message: string };
```

---

# 6. Chat Safety Rules

The frontend MUST NOT:

- render intermediate ADJUST output
- render blocked draft
- calculate safety scores
- show matched rules to ordinary users
- decide whether a human review case is eligible
- send `ruleset_id` as a user-controlled runtime parameter
- stream unverified LLM tokens

The user receives only the final backend-approved result.

---

# 7. Human Review UI

For a BLOCK with review availability:

```text
Safe fallback
      ↓
Request Human Assistance
      ↓
Backend review case
      ↓
Pending Review
```

The frontend may display:

```text
Review Case Status
OPEN
ASSIGNED
RESOLVED
```

The frontend does not alter policy.

---

# 8. Council Portal Navigation

```text
Council
├── Dashboard
├── Rules
├── RuleSets
├── Reviews
├── Evaluations
├── Publish / Activate
└── Audit
```

The navigation must be permission-aware.

Backend remains the authorization source of truth.

---

# 9. Council Dashboard

Display:

```text
Active RuleSets
RuleSets in Review
Pending Approvals
Failed Evaluations
Open Human Reviews
Recent Publications
Recent Activations
```

Suggested cards:

```text
Active RuleSets
Pending Reviews
Evaluation Failures
Open Reviews
```

---

# 10. Rules List

Columns:

```text
Rule ID
Title
Region
Domain
Rule Type
Severity
Default Action
RuleSet
Status
Updated
```

Filters:

```text
Region
Domain
Severity
Status
RuleSet
```

Actions:

```text
View
Edit
Validate
Submit
```

Editing an active/published Rule must create a new governed version; the UI must not offer destructive mutation of an immutable version.

---

# 11. Rule Editor

Fields:

```text
Rule ID
RuleSet
Region
Domain Scope
Rule Type
Title
Rule Text
Severity
Default Action
Block Conditions
Applies To
Violating Examples
Compliant Examples
Test Case IDs
```

Example form:

```text
Rule ID
[ EG-SAFETY-0012 ]

Region
[ Egypt ]

Domain
[ Finance ]

Rule Type
[ Financial Risk ]

Severity
[ High ]

Default Action
[ Adjust ]

Title
[ No unsupported financial guarantees ]

Rule Text
[................................]

Block Conditions
[................................]

Applies To
[x] Input
[x] Draft

Violating Examples
[................................]

Compliant Examples
[................................]

Test Cases
[................................]

[Save Draft] [Validate] [Submit]
```

---

# 12. Rule Validation UI

Validation states:

```text
VALID
INVALID
WARNING
```

Errors should include:

```text
Missing required field
Invalid scope
Invalid severity
Invalid action
Duplicate rule ID
Malformed decision policy
Missing test examples
```

Warnings may include:

```text
Potential ambiguity
Potential duplicate
No test cases
```

Backend validation remains authoritative.

---

# 13. RuleSet List

Columns:

```text
RuleSet
Version
Region
Domain
Status
Evaluation
Approved By
Published At
Activated At
```

Statuses:

```text
DRAFT
IN_REVIEW
APPROVED
PUBLISHED
ACTIVE
RETIRED
```

---

# 14. RuleSet Detail

Show:

```text
RuleSet name
RuleSet ID
Version
Region
Domain
Status
Rules count
Evaluation status
Approval
Publication
Activation
Audit
```

Sections:

```text
Summary
Rules
Evaluation
Approval History
Activation
Audit
```

---

# 15. RuleSet Builder

Create a RuleSet:

```text
Name
Region
Domain Scope
Description
Rules
```

Actions:

```text
Save Draft
Validate
Submit for Review
```

Rules can be selected/added only according to backend API capabilities.

---

# 16. RuleSet Lifecycle UI

```text
DRAFT
 ↓
IN_REVIEW
 ↓
APPROVED
 ↓
PUBLISHED
 ↓
ACTIVE
 ↓
RETIRED
```

Allowed actions:

| Status | UI actions |
|---|---|
| DRAFT | Edit, Validate, Submit |
| IN_REVIEW | Review, Approve, Reject |
| APPROVED | Publish |
| PUBLISHED | Activate |
| ACTIVE | View, Retire |
| RETIRED | View, Audit |

The UI must not offer invalid transitions.

---

# 17. Review Screen

Reviewer sees:

```text
RuleSet version
Change summary
Rules added
Rules modified
Rules removed
Evaluation status
Previous active version
Approval history
```

Actions:

```text
Approve
Reject
Request Changes
```

Approval/rejection must include a reason/comment where required.

---

# 18. Evaluation Screen

Display:

```text
Evaluation Run
RuleSet
Version
Dataset
Evaluator Version
Started
Completed
Status
```

Results:

```text
False Safe
False Block
False Adjust
Rule Coverage
Matched Rule Accuracy
Regional Correctness
Regression Rate
Human Review Agreement
```

Dataset categories:

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

---

# 19. Evaluation Case Detail

Display:

```text
Input
Expected Action
Actual Action
Expected Rule IDs
Matched Rule IDs
Bias Score
Risk Score
Evidence
PASS / FAIL
```

Sensitive data must follow backend privacy rules.

---

# 20. Publish UI

Publish is available only when:

```text
status == APPROVED
evaluation == PASS
```

Confirmation dialog:

```text
Publish RuleSet?

RuleSet: EG-CORE
Version: 3

This creates an immutable published version.

[Cancel] [Publish]
```

After publishing:

```text
PUBLISHED
```

No in-place editing.

---

# 21. Activation UI

Activation is separate from publishing.

```text
Published RuleSet
      ↓
Select Region
      ↓
Select Domain
      ↓
Confirm
      ↓
Region Config.active_safety_ruleset_id
```

Confirmation:

```text
Activate EG-CORE v3 for:

Region: Egypt
Domain: Finance

Previous active version:
EG-CORE v2

[Cancel] [Activate]
```

The backend performs the actual activation.

---

# 22. Active RuleSet View

For every region/domain:

```text
Region: EG
Domain: Finance

ACTIVE RULESET
EG-CORE
Version 3

Published:
...

Activated:
...

[View Rules]
[View Evaluation]
[View Audit]
[Retire]
```

Historical versions remain visible.

---

# 23. Human Review Portal

Separate from RuleSet approval.

Views:

```text
Open
Assigned
Resolved
```

Case:

```text
Case ID
Original User Request
Reason / Safety Context
Matched Rule IDs
Region
Domain
Reviewer
Status
```

The blocked generated draft must not be displayed as the user-facing response.

Reviewer actions:

```text
Approve / Answer
Keep Blocked
```

All decisions are logged.

---

# 24. Audit UI

Filters:

```text
Actor
Entity
Action
Region
Date
RuleSet
Version
```

Event display:

```text
Actor
Action
Entity
Previous State
New State
Reason
Timestamp
```

Required event types include:

```text
Rule created
Rule updated
Rule submitted
Rule approved
Rule rejected
RuleSet published
RuleSet activated
RuleSet retired
Human review created
Human review resolved
```

---

# 25. Frontend API Adapter

Create separate adapters:

```text
chatApi
rulesApi
rulesetsApi
reviewsApi
evaluationsApi
auditApi
```

Example:

```ts
sendChat(request)
listRules(filters)
getRule(id)
createRule(data)
updateRule(id, data)
validateRule(id)
submitRule(id)

listRuleSets(filters)
getRuleSet(id)
createRuleSet(data)
submitRuleSet(id)
approveRuleSet(id, comment)
rejectRuleSet(id, comment)
publishRuleSet(id)
activateRuleSet(id, region, domain)
retireRuleSet(id)

createReview(data)
listReviews(filters)
getReview(id)
resolveReview(id, decision)

runEvaluation(data)
getEvaluation(id)
getEvaluationResults(id)

getAuditEvents(filters)
```

Names are frontend adapter names; HTTP routes follow the backend contract.

---

# 26. State Management

Separate state by feature:

```text
chatState
rulesState
rulesetState
reviewState
evaluationState
auditState
```

Do not put all Council data into one global state object.

Server state should support:

```text
loading
success
error
stale
mutation pending
```

After mutations, invalidate/refetch affected resources.

---

# 27. RBAC UI

Capabilities:

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

Hide unavailable actions in the UI, but never rely on hiding as authorization.

Backend authorization is authoritative.

---

# 28. Error States

User Chat:

```text
API error
Safety unavailable
Human review unavailable
```

Council:

```text
Validation failed
Approval failed
Publish failed
Activation failed
Evaluation failed
Permission denied
Version conflict
```

Show safe user-facing messages.

Never show:

```text
stack trace
database exception
provider credentials
internal prompts
raw evaluator errors
```

---

# 29. Version Conflict

If another Council user publishes a newer version while the current user is editing:

```text
Version conflict
 ↓
Reload latest
 ↓
Compare changes
 ↓
Resolve
```

Do not silently overwrite another user's governed changes.

---

# 30. Frontend Testing

## Component tests

- Rule form
- RuleSet lifecycle
- approval buttons
- publish button
- activation dialog
- evaluation results
- audit table
- human review

## Integration tests

```text
Chat → SAFE
Chat → BLOCK
BLOCK → Human Review

Rule → Draft
Rule → Review
RuleSet → Approve
RuleSet → Publish
RuleSet → Activate

Evaluation → Pass
Evaluation → Fail
```

## Permission tests

Verify each capability hides/disables the correct UI actions.

## Regression

Existing User Chat tests must continue to pass.

---

# 31. Accessibility

Council forms must support:

- keyboard navigation
- labels
- focus management
- validation announcements
- accessible dialogs
- accessible tables
- clear status indicators

---

# 32. Performance

Do not preload all RuleSets/Rules.

Use:

```text
pagination
filters
server-side search
lazy loading
```

Evaluation results should paginate for large datasets.

---

# 33. No Streaming

The Safety Brain response must not stream unverified LLM output.

The user receives only the final backend result after safety evaluation.

---

# 34. Definition of Done

### User Chat

- [ ] Existing chat UI preserved.
- [ ] SAFE renders approved message.
- [ ] ADJUST intermediate output never appears.
- [ ] BLOCK renders safe fallback only.
- [ ] Human-review CTA is backend-controlled.
- [ ] No GPT/provider calls from frontend.
- [ ] No safety scoring/decision logic in frontend.
- [ ] No streaming.

### Council

- [ ] Dashboard exists.
- [ ] Rules list exists.
- [ ] Rule editor matches backend schema.
- [ ] Rule validation exists.
- [ ] RuleSet builder exists.
- [ ] RuleSet lifecycle exists.
- [ ] Review/approval exists.
- [ ] Evaluation screen exists.
- [ ] Publish is separate from Activate.
- [ ] Region/domain activation exists.
- [ ] Active RuleSet is visible.
- [ ] Historical versions remain visible.
- [ ] Human Review is separate from Council approval.
- [ ] Audit UI exists.
- [ ] RBAC-aware UI exists.

### Quality

- [ ] Existing build passes.
- [ ] Existing lint passes.
- [ ] TypeScript strictness remains enabled.
- [ ] New components have tests.
- [ ] API errors are handled safely.
