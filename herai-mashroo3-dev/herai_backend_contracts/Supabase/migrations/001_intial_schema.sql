-- HerAI initial Supabase schema
-- Apply in Supabase SQL Editor.
-- After applying, do not edit this migration; add a new migration.

create extension if not exists vector;

create type public.rule_status as enum ('draft', 'active', 'inactive');
create type public.rule_decision_type as enum ('adjust', 'block');
create type public.verdict_action as enum ('safe', 'adjust', 'block');

-- Users table: links Supabase Auth user to user profile
create table public.users (
  id uuid primary key references auth.users(id),
  email text not null unique,
  first_name text,
  last_name text,
  age integer,
  domain text,
  country text,
  city text,
  phone_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  region text,
  region_code text,
  region_config_version text,
  domain text,
  domain_scope text,
  persona text,
  message text not null,
  scrubbed_message text,
  draft text,
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
  created_by text not null,
  "timestamp" timestamptz not null default now(),
  rationale text not null,
  version text not null
);

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

-- Application-table access is backend-only through the Supabase
-- service-role client. The browser must not query these tables.
