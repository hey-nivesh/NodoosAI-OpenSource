-- ============================================================
-- Nodoos AI — Full Schema (Multi-Tenant + RLS)
-- Apply to Supabase via the SQL Editor
-- ============================================================

-- Enable pgvector extension for future semantic search
create extension if not exists vector;

-- ────────────────────────────────────────────────────────────
-- CORE MULTI-TENANCY TABLES
-- ────────────────────────────────────────────────────────────

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

create table if not exists slack_integrations (
    id uuid primary key default gen_random_uuid(),
    org_id uuid unique references organizations(id) on delete cascade,
    team_id text not null,
    team_name text,
    access_token_encrypted text not null,
    incoming_webhook_url text not null,
    default_channel text,
    connected_by uuid references profiles(id),
    connected_at timestamptz default now()
);

create table if not exists notifications (
    id uuid primary key default gen_random_uuid(),
    org_id uuid references organizations(id) on delete cascade,
    type text not null,  -- 'playbook_triggered' | 'slack_error' | 'agent_run_complete' | 'slack_not_connected'
    title text not null,
    body text,
    read boolean default false,
    created_at timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- CORE PRODUCT TABLES
-- ────────────────────────────────────────────────────────────

create table if not exists fact_product_usage (
    id uuid primary key default gen_random_uuid(),
    org_id uuid references organizations(id) on delete cascade,
    account_id text not null,
    account_name text not null,
    arr numeric(10,2) not null,
    metric_date date not null,
    active_users int not null default 0,
    api_calls int not null default 0,
    feature_execution_count int not null default 0,
    created_at timestamptz default now()
);

create table if not exists support_tickets (
    ticket_id text primary key,
    org_id uuid references organizations(id) on delete cascade,
    account_id text not null,
    created_at timestamptz not null default now(),
    subject text not null,
    body text not null,
    status text not null default 'open'
);

create table if not exists churn_rescue_actions (
    action_id uuid primary key default gen_random_uuid(),
    org_id uuid references organizations(id) on delete cascade,
    account_id text not null,
    account_name text not null,
    arr numeric(10,2) not null,
    usage_drop_pct numeric(5,2) not null,
    root_cause text,
    reasoning_summary text,
    recommended_playbook text not null,
    action_status text not null default 'TRIGGERED',
    slack_notification_sent boolean default false,
    created_at timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- IDEMPOTENT MIGRATION UPDATES FOR EXISTING TABLES
-- (Runs if the tables already existed without org_id columns)
-- ────────────────────────────────────────────────────────────

alter table fact_product_usage
  add column if not exists org_id uuid references organizations(id) on delete cascade;

alter table support_tickets
  add column if not exists org_id uuid references organizations(id) on delete cascade;

alter table churn_rescue_actions
  add column if not exists org_id uuid references organizations(id) on delete cascade;

alter table churn_rescue_actions
  add column if not exists slack_notification_sent boolean default false;

-- ────────────────────────────────────────────────────────────
-- PLAYBOOKS RULES MATRIX TABLE
-- ────────────────────────────────────────────────────────────

create table if not exists playbook_rules (
    id uuid primary key default gen_random_uuid(),
    org_id uuid references organizations(id) on delete cascade,
    root_cause text not null,
    arr_tier_label text not null,    -- e.g. 'Enterprise (>$100k)'
    arr_threshold_min numeric(12,2) not null default 0,
    arr_threshold_max numeric(12,2),  -- null = unlimited
    playbook_name text not null,
    description text,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────────────────────

create index if not exists idx_fact_usage_account_date on fact_product_usage (account_id, metric_date);
create index if not exists idx_fact_usage_org on fact_product_usage (org_id);
create index if not exists idx_support_tickets_account on support_tickets (account_id);
create index if not exists idx_support_tickets_org on support_tickets (org_id);
create index if not exists idx_churn_rescue_account on churn_rescue_actions (account_id);
create index if not exists idx_churn_rescue_org on churn_rescue_actions (org_id);
create index if not exists idx_notifications_org on notifications (org_id, read, created_at desc);
create index if not exists idx_profiles_org on profiles (org_id);

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY POLICIES
-- ────────────────────────────────────────────────────────────

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table slack_integrations enable row level security;
alter table notifications enable row level security;
alter table fact_product_usage enable row level security;
alter table support_tickets enable row level security;
alter table churn_rescue_actions enable row level security;
alter table playbook_rules enable row level security;

-- Helper: get current user's org_id
create or replace function get_my_org_id()
returns uuid language sql security definer stable as $$
  select org_id from profiles where id = auth.uid()
$$;

-- organizations: members can read their own org
drop policy if exists "org members can read own org" on organizations;
create policy "org members can read own org"
  on organizations for select
  using (id = get_my_org_id());

drop policy if exists "org admins can update own org" on organizations;
create policy "org admins can update own org"
  on organizations for update
  using (id = get_my_org_id());

-- profiles: read own org's profiles
drop policy if exists "org isolation on profiles" on profiles;
create policy "org isolation on profiles"
  on profiles for all
  using (org_id = get_my_org_id());

-- slack_integrations: org isolation
drop policy if exists "org isolation on slack_integrations" on slack_integrations;
create policy "org isolation on slack_integrations"
  on slack_integrations for all
  using (org_id = get_my_org_id());

-- notifications: org isolation
drop policy if exists "org isolation on notifications" on notifications;
create policy "org isolation on notifications"
  on notifications for all
  using (org_id = get_my_org_id());

-- fact_product_usage: org isolation
drop policy if exists "org isolation on fact_product_usage" on fact_product_usage;
create policy "org isolation on fact_product_usage"
  on fact_product_usage for all
  using (org_id = get_my_org_id());

-- support_tickets: org isolation
drop policy if exists "org isolation on support_tickets" on support_tickets;
create policy "org isolation on support_tickets"
  on support_tickets for all
  using (org_id = get_my_org_id());

-- churn_rescue_actions: org isolation
drop policy if exists "org isolation on churn_rescue_actions" on churn_rescue_actions;
create policy "org isolation on churn_rescue_actions"
  on churn_rescue_actions for all
  using (org_id = get_my_org_id());

-- playbook_rules: org isolation
drop policy if exists "org isolation on playbook_rules" on playbook_rules;
create policy "org isolation on playbook_rules"
  on playbook_rules for all
  using (org_id = get_my_org_id());

-- ────────────────────────────────────────────────────────────
-- AUTO-CREATE ORG + PROFILE ON SIGN-UP
-- Triggered on auth.users INSERT by Supabase
-- ────────────────────────────────────────────────────────────

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  new_org_id uuid;
  user_email text;
  org_name text;
begin
  user_email := new.email;
  org_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    split_part(user_email, '@', 1) || '''s Workspace'
  );

  -- Create organization
  insert into public.organizations (name)
  values (org_name)
  returning id into new_org_id;

  -- Create profile with admin role (first user of this org)
  insert into public.profiles (id, org_id, full_name, role)
  values (
    new.id,
    new_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(user_email, '@', 1)),
    'admin'
  );

  return new;
end;
$$;

-- Drop if exists to allow re-running
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
