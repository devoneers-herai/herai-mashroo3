# HerAI Mashroo3

Build Team — Farida, Yassin, Omar, Moustafa, Nour
Governed by: HerAI Technical Architecture v3 · DEVONEERS Platform DNA v4.0

## Stack
- Frontend: Next.js → Vercel
- Backend: Express → Railway
- Database: Supabase (Postgres, free tier) — region: Frankfurt (eu-central-1)
- Model access: OpenAI, behind `services/ai.service.ts` only

## Getting started (clean clone)
1. Clone the repo and check out `dev`
2. Copy `.env.example` to `.env` in `apps/api` and `apps/web`, fill in the values
3. Install dependencies in `apps/web` and `apps/api`
4. Run the backend (`apps/api`) and frontend (`apps/web`) locally

> This section must be corrected the moment it turns out to be wrong.

## Branching
- `main` — always deployable, protected, PR only
- `dev` — integration branch, everyone merges here first
- `feat/...`, `fix/...`, `chore/...` — branch from `dev`, merge into `dev`

## Non-negotiables
See the Engineering Handbook, Section 1. In short:
- No secret is ever committed
- All model access goes through `services/ai.service.ts`
- No unverified draft reaches the browser
- Every verdict is logged, including safe ones
- No direct pushes to `main`
