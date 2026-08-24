-- 002_council_rules.sql
-- Migration to create the council_rules table for Council rule authoring and safety enforcement.

create table if not exists public.council_rules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  rule_text text not null,
  domain text,
  region_code text,
  created_by uuid references auth.users(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Index for fast active-rule lookup by region/domain
create index if not exists idx_council_rules_lookup on public.council_rules (region_code, domain, is_active);
