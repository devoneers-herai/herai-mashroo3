# HerAI Definition of Done

## 1. Purpose

A feature or implementation is considered Done only when the required
functional, safety, privacy, logging, testing, and review requirements
have been satisfied.

---

# 2. Product-Level Definition of Done

The Phase 1 product is considered Done when:

- The landing page is live at a public URL.
- The landing page loads cleanly on mobile.
- The chat demo works for both Lebanon and Egypt.
- The country toggle is genuinely connected to the region configuration.
- GPT responses are real, not placeholders.
- Every response carries a real safety flag and verdict from the classifier.
- At least 2–3 real Council rules exist in the database.
- Each Council rule contains a `created_by` value.
- Every ADJUST or BLOCK decision is captured in the escalation log.
- Every chat exchange is logged to Supabase.
- QA has completed the quality gate checklist.
- The lead-capture form works end-to-end.
- A Phase 2 Kickoff note exists describing the deferred items and their order.

---

# 3. Safety Definition of Done

A safety-related implementation is Done only when:

- Bias and risk are returned as separate scores.
- The action is one of:
  - `safe`
  - `adjust`
  - `block`
- SAFE verdicts are logged.
- ADJUST verdicts are logged.
- BLOCK verdicts are logged.
- ADJUST responses are re-checked after rewriting.
- Safety failures result in BLOCK.
- Safety timeouts result in BLOCK.
- An unverified draft is never returned to the client.
- Token streaming is not used for the chat response.

---

# 4. Privacy Definition of Done

The implementation is Done only when:

- PII is scrubbed before database persistence.
- Database rows contain scrubbed text.
- Raw user text is not stored.
- No secret is committed to the repository.
- Backend secrets remain in the backend environment.
- Frontend-exposed environment variables contain only values safe to expose.

---

# 5. Governance Definition of Done

The implementation is Done only when:

- Every verdict records the region configuration version.
- Every verdict records the matched rule IDs.
- Every verdict records bias and risk scores separately.
- Council rules contain a `created_by` value.
- Safety decisions can be traced back to the applicable rules.
- Historical decisions can be associated with the configuration version
  that produced them.

---

# 6. Architecture Definition of Done

The implementation is Done only when:

- AI provider access occurs through `ai.service.ts`.
- No provider SDK is imported outside `ai.service.ts`.
- The frontend communicates through the backend API.
- The frontend does not access the database directly.
- Region-specific behavior uses `region_config`.
- Core logic is not duplicated for individual regions.
- The Safety Evaluation cannot be bypassed.
- The documented API contract is respected.
- The documented data model is respected.

---

# 7. Testing Definition of Done

The implementation is Done only when the relevant test scenarios pass.

The test scenarios must cover:

- Country selection
- Region configuration
- Persona matching
- Unclear input
- SAFE verdict
- ADJUST verdict
- BLOCK verdict
- Safety timeout
- Safety failure
- PII scrubbing
- Verdict logging
- Rule matching
- Escalation logging

QA must specifically verify the ADJUST and BLOCK flows.

---

# 8. Quality Gate

Before final sign-off, QA must verify:

- No deferred Phase 2 feature was accidentally wired into the Phase 1 product.
- No real WhatsApp production integration is present.
- No SMS production integration is present.
- No Voice production integration is present.
- No full Council authentication is present.
- No paid infrastructure tier is required.
- Regression testing has been completed.
- Cross-browser testing has been completed.
- Mobile viewport testing has been completed.
- Known issues and deferred items are documented.

---

# 9. Security Verification

Before release:

- `.env` is not committed.
- Secrets are stored in the approved environment configuration.
- Secret scanning is enabled.
- Push protection is enabled.
- No secret appears in Git history.
- Backend secrets are never exposed to the browser.
- The production branch is protected.
- Changes reach production through the approved Pull Request workflow.

---

# 10. Pull Request Definition of Done

Every Pull Request must explain:

### What changed

A short description of the implementation.

### How to test it

Exact steps that another team member can follow.

### What it does not do

Anything deliberately excluded from the implementation.

A Pull Request is not considered complete until the required review
has been completed.

---

# 11. Final Sign-Off

A Phase 1 release requires:

- Engineering implementation complete
- Safety checks verified
- Privacy checks verified
- Logging verified
- QA quality gate signed off
- Known issues documented
- Deferred Phase 2 work documented

Only after these checks are satisfied is the implementation considered Done.
