# HerAI Definition of Done

A backend feature is Done when:

## Contract
- API request/response matches the contract.
- DB fields match the data model.
- Region resolution uses `region_config`.
- Safety values are safe/adjust/block.

## Safety
- Bias and risk are separate.
- SAFE verdicts are logged.
- ADJUST is re-checked.
- BLOCK withholds the draft.
- Safety errors/timeouts produce BLOCK.
- No unverified draft reaches the client.
- No token streaming.

## Privacy
- PII is scrubbed before persistence.
- Raw input is not stored.
- Secrets are not committed.

## Governance
- `region_config_version` is recorded.
- `matched_rule_ids` are recorded.
- Rules contain `created_by`.

## Architecture
- Provider SDK only in `ai.service.ts`.
- Routes remain thin.
- DB access is backend-only.
- Region logic is configuration-driven.

## Testing
- EG and LB.
- SAFE, ADJUST, BLOCK.
- Safety timeout.
- PII scrubbing.
- Verdict persistence.
- Rule matching.
- Council rule creation.
