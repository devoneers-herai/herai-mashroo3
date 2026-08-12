-- HerAI initial schema + authentication additions
-- Supabase / PostgreSQL
--
-- IMPORTANT:
-- This is the UPDATED version of the initial migration.
-- If the original 001_initial_schema.sql has NOT been applied yet,
-- use this file instead of the old version.
--
-- If the original migration has ALREADY been applied to Supabase,
-- DO NOT edit/re-run it. Create a new numbered migration (002_...)
-- containing only the authentication additions.

create extension if not exists vector;

create type public.rule_status as enum ('draft', 'active', 'inactive');
create type public.rule_decision_type as enum ('adjust', 'block');
create type public.verdict_action as enum ('safe', 'adjust', 'block');

create table public.rules (
  rule_id text primary key,
  version integer not null default 1,
  status public.rule_status not null default 'draft',
  region_code text not null,
  domain_scope text not null,
  category text not null,
  severity text not null,
  decision_type public.rule_decision_type not null,
  trigger_description text not null,
  adjustment_instruction text not null,
  fallback_message text not null,
  created_by text not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),

  -- Authenticated Supabase user who owns this conversation.
  -- Must be populated from the authenticated auth context by the backend.
  user_id uuid references auth.users(id) on delete set null,

  region_code text not null,
  region_config_version text not null,
  domain_scope text,
  scrubbed_message text not null,
  created_at timestamptz not null default now()
);

create table public.verdicts (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id),
  action public.verdict_action not null,
  bias_score double precision not null,
  risk_score double precision not null,
  matched_rule_ids text[] not null default '{}',
  region_config_version text not null,
  draft_response text not null,
  final_response text,
  created_at timestamptz not null default now()
);

create table public.council_decisions (
  id uuid primary key default gen_random_uuid(),
  decision_type text not null,
  decision_content text not null,

  -- Authenticated Council actor.
  -- The backend must derive this from the authenticated auth context.
  created_by uuid references auth.users(id) on delete set null,

  "timestamp" timestamptz not null default now(),
  rationale text not null,
  version text not null
);

-- Council account / membership layer.
-- Supabase Auth remains responsible for authentication credentials.
create type public.council_membership_status as enum (
  'pending',
  'approved',
  'rejected'
);

create table public.council_members (
  id uuid primary key default gen_random_uuid(),

  -- One Council membership per authenticated Supabase user.
  user_id uuid not null unique references auth.users(id) on delete cascade,

  role text not null default 'council',
  status public.council_membership_status not null default 'pending',

  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null
);

create index conversations_user_id_idx
  on public.conversations(user_id);

create index verdicts_conversation_id_idx
  on public.verdicts(conversation_id);

create index verdicts_region_config_version_idx
  on public.verdicts(region_config_version);

create index conversations_region_code_idx
  on public.conversations(region_code);

create index rules_region_domain_idx
  on public.rules(region_code, domain_scope);

create index rules_status_idx
  on public.rules(status);

create index council_members_status_idx
  on public.council_members(status);

create index council_members_role_idx
  on public.council_members(role);

-- Week 1 architecture:
-- Application-table access is backend-only through the Supabase service-role
-- client. The browser must not directly query/write these application tables.
--
-- Supabase Auth handles passwords and authentication sessions.
-- Do NOT create an application password table.
--
-- Council authorization rule:
-- authenticated user
--   -> council_members row exists
--   -> status = 'approved'
--   -> Council operation allowed
--
-- The frontend must never be trusted to set status='approved' or grant
-- Council privileges to itself.
