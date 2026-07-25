-- ============================================================
-- Nodoos AI — Migration 001: Add Multi-Tenancy to Existing Tables
-- Safe to run on an existing Supabase instance that already has
-- fact_product_usage, support_tickets, churn_rescue_actions
-- ============================================================

-- Ensure the lookup tables exist first
create table if not exists organizations (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    created_at timestamptz default now()
);

create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    org_id uuid references organizations(id) on delete cascade,
    full_name text,
    role text not null default 'csm' check (role in ('admin','csm')),
    avatar_url text,
    created_at timestamptz default now()
);

-- Add org_id to existing tables (nullable first so it doesn't break existing rows)
alter table fact_product_usage
  add column if not exists org_id uuid references organizations(id) on delete cascade;

alter table support_tickets
  add column if not exists org_id uuid references organizations(id) on delete cascade;

alter table churn_rescue_actions
  add column if not exists org_id uuid references organizations(id) on delete cascade;

-- Add slack_notification_sent to churn_rescue_actions if missing
alter table churn_rescue_actions
  add column if not exists slack_notification_sent boolean default false;

-- Add indexes
create index if not exists idx_fact_usage_org on fact_product_usage (org_id);
create index if not exists idx_support_tickets_org on support_tickets (org_id);
create index if not exists idx_churn_rescue_org on churn_rescue_actions (org_id);

-- NOTE: After running this migration, you should backfill org_id for existing rows
-- by assigning them to a default/demo organization. Example:
-- UPDATE fact_product_usage SET org_id = '<your-demo-org-id>' WHERE org_id IS NULL;
-- UPDATE support_tickets SET org_id = '<your-demo-org-id>' WHERE org_id IS NULL;
-- UPDATE churn_rescue_actions SET org_id = '<your-demo-org-id>' WHERE org_id IS NULL;
