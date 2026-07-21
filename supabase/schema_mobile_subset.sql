-- Minimal schema subset needed to run the mobile app end-to-end.
-- This is NOT the full CRM schema (that also needs students, workshops,
-- payments, courses, audit_log, etc.) — just what Dashboard/Leads/Followups
-- screens depend on. Extend this file as the web portal schema grows;
-- never DROP existing tables in a later migration, only ALTER/ADD.

create extension if not exists "uuid-ossp";

create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in
    ('super_admin','admin','team_leader','telecaller','counselor','accountant')),
  expo_push_token text,
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  mobile text not null,
  alternate_mobile text,
  email text,
  city text,
  state text,
  lead_source text,
  campaign text,
  course_interested text,
  status text not null default 'new' check (status in
    ('new','contacted','interested','not_interested','followup_scheduled',
     'admission_confirmed','lost')),
  remarks text,
  assigned_user_id uuid references user_profiles(id),
  created_at timestamptz not null default now(),
  last_followup_at timestamptz,
  next_followup_at timestamptz,
  is_deleted boolean not null default false -- soft delete
);

create index if not exists idx_leads_status on leads(status);
create index if not exists idx_leads_assigned on leads(assigned_user_id);
create index if not exists idx_leads_mobile on leads(mobile);

create table if not exists call_logs (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references leads(id) on delete cascade,
  user_id uuid not null references user_profiles(id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  duration_seconds integer not null default 0,
  notes text,
  outcome text not null,
  created_followup_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_call_logs_lead on call_logs(lead_id);

create table if not exists followups (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references leads(id) on delete cascade,
  user_id uuid not null references user_profiles(id),
  date date not null,
  time text not null,
  type text not null default 'call',
  priority text not null default 'medium',
  notes text,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_followups_date on followups(date);
create index if not exists idx_followups_lead on followups(lead_id);

alter table call_logs
  add constraint fk_call_logs_followup
  foreign key (created_followup_id) references followups(id) on delete set null;

-- Row Level Security: telecallers see only their own/assigned leads;
-- admins/super_admins see everything. Adjust per your final role matrix.
alter table leads enable row level security;
alter table call_logs enable row level security;
alter table followups enable row level security;

create policy "leads_select" on leads for select
  using (
    assigned_user_id = auth.uid()
    or exists (
      select 1 from user_profiles up
      where up.id = auth.uid() and up.role in ('super_admin','admin','team_leader')
    )
  );

create policy "leads_write_own_or_admin" on leads for all
  using (
    assigned_user_id = auth.uid()
    or exists (
      select 1 from user_profiles up
      where up.id = auth.uid() and up.role in ('super_admin','admin','team_leader')
    )
  );

create policy "call_logs_owner" on call_logs for all
  using (user_id = auth.uid() or exists (
    select 1 from user_profiles up
    where up.id = auth.uid() and up.role in ('super_admin','admin','team_leader')
  ));

create policy "followups_owner" on followups for all
  using (user_id = auth.uid() or exists (
    select 1 from user_profiles up
    where up.id = auth.uid() and up.role in ('super_admin','admin','team_leader')
  ));
