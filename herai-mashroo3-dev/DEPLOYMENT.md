# Deployment and Secrets Checklist

Important: rotate any keys that were shared publicly before deploying. Revoke the old OpenAI and Supabase keys and generate new ones.

## Railway environment variables

Set these in your Railway project (server-only variables must be marked secret):

- `SUPABASE_URL` = https://<project>.supabase.co
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `DATABASE_URL` (if your app expects it)
- `OPENAI_API_KEY` (server-only)
- `COUNCIL_SHARED_TOKEN` (server-only)

Frontend/public variables (prefix with `NEXT_PUBLIC_`):

- `NEXT_PUBLIC_SUPABASE_URL` = https://<project>.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public anon key)
- `NEXT_PUBLIC_API_URL` = https://<your-backend-host>/api

Railway CLI example:

```bash
railway variables set SUPABASE_URL="https://jidewgvefnhtsfdnkwup.supabase.co"
railway variables set SUPABASE_SERVICE_ROLE_KEY="<new-service-role-key>"
railway variables set OPENAI_API_KEY="<new-openai-key>"
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY="<new-anon-key>"
```

## Supabase: rotate keys and apply migrations

1. Rotate keys: open Supabase Dashboard → Settings → API → Regenerate keys. Revoke any leaked keys.
2. Apply SQL migrations (choose one):

- SQL Editor (manual): Open Supabase Dashboard → SQL editor → paste and run the files in `herai_backend_contracts/Supabase/migrations/` (e.g. `001_intial_schema.sql`, `001_initial_schema_with_auth.sql`).

- CLI (recommended for automation):

```bash
# Install CLI: https://supabase.com/docs/guides/cli
supabase login
supabase link --project-ref jidewgvefnhtsfdnkwup
supabase db push
```

Note: replace `jidewgvefnhtsfdnkwup` with your project ref if different.

## Triggering deployment

- Push your changes to the GitHub repo connected to Railway. Railway will auto-deploy on push to the configured branch.
- Or trigger a manual deploy from the Railway dashboard.

Example git commands:

```bash
git add .
git commit -m "deploy: configure env and add ai/supabase clients"
git push origin main
```

## Verify staging after deploy

1. Confirm server-side services read secrets from environment:

- `apps/api/src/db/supabase.ts`
- `apps/api/src/services/ai.service.ts`

2. Smoke tests (replace `API_URL` with your deployed backend URL):

```bash
# Chat endpoint sanity check (POST /api/chat)
curl -X POST "$API_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"hello","region":"EG","persona":"test"}'
```

3. Verify data in Supabase dashboard (conversations, verdicts, rules) and that no raw PII is stored.

## Security checklist (must do BEFORE deploy)

- Rotate all leaked keys and update Railway variables.
- Ensure `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` are set as server-only secrets.
- Ensure frontend only uses `NEXT_PUBLIC_*` values.
- Add `.env` to `.gitignore` and do NOT commit secrets.
- Enable secret scanning and push protection on the repo.

## Rollback plan

- If deployment exposes secrets or breaks safety flows, revert the commit and revoke the rotated keys. Use Railway's rollback/deploy history.

## Helpful links

- Supabase dashboard (project): https://supabase.com/dashboard/project/jidewgvefnhtsfdnkwup
- Migrations folder: `herai_backend_contracts/Supabase/migrations/`

---
If you want, I can also add a script (`scripts/deploy.sh`) to automate Railway variable setting (without secrets embedded) and a migration helper. Tell me which and I will add it.
