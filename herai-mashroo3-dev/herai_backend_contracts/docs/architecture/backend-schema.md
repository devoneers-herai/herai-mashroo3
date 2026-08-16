# HerAI Backend Schema

## Purpose
Implementation contract for the HerAI backend.

## Structure
```text
apps/api/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── chat.routes.ts
│   │   └── council.routes.ts
│   ├── services/
│   │   ├── ai.service.ts
│   │   ├── safety.service.ts
│   │   ├── chat.service.ts
│   │   └── scrub.service.ts
│   ├── middleware/
│   └── db/
│       └── supabase.ts
└── package.json
```

Routes are thin; business logic lives in services.

## Request pipeline
```text
receive message + region + persona
        ↓
scrub PII
        ↓
resolve region_config + version
        ↓
generate draft
        ↓
evaluate safety
        ↓
SAFE / ADJUST / BLOCK
        ↓
write verdict
        ↓
return verified response
```

The draft remains server-side until Safety Evaluation completes. Safety errors/timeouts produce BLOCK.

## Service contracts
```typescript
// ai.service.ts — only provider SDK boundary
generateDraft(input: DraftInput): Promise<string>
evaluateSafety(input: EvalInput): Promise<Verdict>

// chat.service.ts
handleChat(input: ChatInput): Promise<ChatOutput>

// safety.service.ts
evaluate(draft: string, context: SafetyContext): Promise<Verdict>

// scrub.service.ts
scrub(input: string): Promise<string>
```

## API
### POST /api/chat
Request:
```json
{"message":"string","region":"EG","persona":"string"}
```

Response:
```json
{"response":"string","safety_flag":"safe","verdict":"safe","matched_rule_ids":[]}
```

### POST /api/council/rules
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

## Safety type
```typescript
type SafetyAction = "safe" | "adjust" | "block";

interface Verdict {
  bias_score: number;
  risk_score: number;
  action: SafetyAction;
  matched_rule_ids: string[];
}
```

## Database
Core tables:
`rules`, `conversations`, `verdicts`, `council_decisions`.

The browser never accesses application tables directly; the backend uses the Supabase service-role client.

## Invariants
1. Provider SDK only in `ai.service.ts`.
2. No unverified draft reaches the browser.
3. Safety failure/timeout => BLOCK.
4. PII is scrubbed before the first DB write.
5. Every verdict is logged, including SAFE.
6. Every verdict records `region_config_version`.
7. Bias and risk remain separate.
8. `matched_rule_ids` is retained.
9. No token streaming for chat.
10. Region behavior is resolved through `region_config`.
