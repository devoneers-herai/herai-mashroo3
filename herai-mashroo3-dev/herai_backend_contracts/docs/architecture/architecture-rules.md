# HerAI Architecture Rules

1. No secrets in Git.
2. All model access goes through `services/ai.service.ts`.
3. No provider SDK elsewhere.
4. Draft stays server-side until safety check completes.
5. Safety error/timeout => BLOCK.
6. PII removed before first DB write.
7. Every verdict is logged, including SAFE.
8. Every verdict records `region_config_version`.
9. Bias and risk are separate.
10. Keep `matched_rule_ids` for traceability.
11. ADJUST requires rewrite + one re-check.
12. No chat token streaming.
13. Routes are thin; logic is in services.
14. Browser does not access application tables directly.
15. Region behavior is configuration-driven.
16. Secrets use environment variables.
17. API/schema changes require architectural review.
18. `main` changes arrive through Pull Requests.
