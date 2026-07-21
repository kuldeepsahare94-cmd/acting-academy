-- Run this AFTER schema_mobile_subset.sql. Adds every remaining module from
-- the master spec: Courses, Students, Workshops, Payments, Activity Timeline,
-- Notifications, Role Permissions, Audit Log — plus the auto lead->student
-- conversion trigger. Uses `if not exists` / `add column if not exists`
-- throughout so re-running this on an existing database never drops data.

-- ============================================================
-- COURSE MODULE
-- Fields: Course Name, Duration, Fees, Description, Active
-- ============================================================
create table if not exists courses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  duration text, -- e.g. "6 months", "12 weeks"
  fees numeric(10,2) not null default 0,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Structured link from Lead -> Course, in addition to the free-text
-- course_interested column that already exists on leads.
alter table leads add column if not exists course_id uuid references courses(id);
create index if not exists idx_leads_course on leads(course_id);

-- ============================================================
-- STUDENT MODULE
-- Fields: Student ID, Name, Mobile, Email, Address, City, Parent Name,
-- Parent Mobile, Course, Admission Date, Batch, Status.
-- lead_id keeps the full conversion history (which lead became this student).
-- ============================================================
create table if not exists students (
  id uuid primary key default uuid_generate_v4(),
  student_code text unique not null, -- human-readable Student ID
  lead_id uuid unique references leads(id), -- one lead converts to at most one student
  name text not null,
  mobile text not null,
  email text,
  address text,
  city text,
  state text,
  parent_name text,
  parent_mobile text,
  course_id uuid references courses(id),
  admission_date date not null default current_date,
  batch text,
  status text not null default 'active' check (status in
    ('active','completed','dropped','on_hold')),
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_students_course on students(course_id);
create index if not exists idx_students_status on students(status);
create index if not exists idx_students_mobile on students(mobile);

-- ============================================================
-- WORKSHOP MODULE
-- Fields: Workshop Name, Date, Start Time, End Time, Venue, Trainer, Capacity
-- Many-to-many with students (one workshop, many students; one student,
-- many workshops), with a Present/Absent attendance flag per registration.
-- ============================================================
create table if not exists workshops (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  date date not null,
  start_time text not null, -- "HH:mm"
  end_time text not null,
  venue text,
  trainer text,
  capacity integer,
  created_at timestamptz not null default now()
);

create table if not exists workshop_attendees (
  id uuid primary key default uuid_generate_v4(),
  workshop_id uuid not null references workshops(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  attendance text not null default 'not_marked' check (attendance in
    ('present','absent','not_marked')),
  registered_at timestamptz not null default now(),
  unique (workshop_id, student_id)
);

create index if not exists idx_workshop_attendees_workshop on workshop_attendees(workshop_id);
create index if not exists idx_workshop_attendees_student on workshop_attendees(student_id);

-- ============================================================
-- PAYMENT MODULE
-- Fields: Student, Course, Amount, Due Amount, Payment Date, Payment Mode,
-- Transaction Number, Receipt Number, Status (Paid/Partial/Pending)
-- ============================================================
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  course_id uuid references courses(id),
  amount numeric(10,2) not null,
  due_amount numeric(10,2) not null default 0,
  payment_date date not null default current_date,
  payment_mode text, -- cash / UPI / card / bank transfer / cheque
  transaction_number text,
  receipt_number text,
  status text not null default 'pending' check (status in ('paid','partial','pending')),
  created_by uuid references user_profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_payments_student on payments(student_id);
create index if not exists idx_payments_status on payments(status);

-- ============================================================
-- ACTIVITY TIMELINE (unified across Lead and Student)
-- Every call, note, followup, assignment, status change, payment, and
-- workshop registration should show up on one timeline. Rather than
-- separately merging call_logs + followups client-side forever, this table
-- is the durable, queryable timeline the web portal and mobile app both use.
-- ============================================================
create table if not exists activity_log (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null check (entity_type in ('lead','student')),
  entity_id uuid not null,
  activity_type text not null check (activity_type in
    ('call','note','followup','assignment','status_change','payment',
     'workshop_registration')),
  description text,
  metadata jsonb,
  created_by uuid references user_profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_log_entity on activity_log(entity_type, entity_id);

-- ============================================================
-- NOTIFICATIONS (push + in-app log)
-- Types: New Lead, Lead Assigned, Followup Reminder, Missed Followup,
-- Payment Due, Workshop Tomorrow, Admission Done
-- ============================================================
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  title text not null,
  body text,
  type text not null check (type in
    ('new_lead','lead_assigned','followup_reminder','missed_followup',
     'payment_due','workshop_tomorrow','admission_done')),
  related_entity_type text,
  related_entity_id uuid,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on notifications(user_id, read);

-- ============================================================
-- ROLE PERMISSIONS MATRIX
-- Per spec: each role's access is configurable per module across
-- View / Create / Edit / Delete / Export / Assign Leads / Payment Access /
-- Dashboard Access.
-- ============================================================
create table if not exists role_permissions (
  id uuid primary key default uuid_generate_v4(),
  role text not null check (role in
    ('super_admin','admin','team_leader','telecaller','counselor','accountant')),
  module text not null, -- 'leads' | 'students' | 'courses' | 'workshops' | 'payments' | 'reports'
  can_view boolean not null default false,
  can_create boolean not null default false,
  can_edit boolean not null default false,
  can_delete boolean not null default false,
  can_export boolean not null default false,
  can_assign_leads boolean not null default false,
  can_access_payments boolean not null default false,
  can_access_dashboard boolean not null default true,
  unique (role, module)
);

-- Sensible starting defaults — tune per your real policy in the admin panel.
insert into role_permissions (role, module, can_view, can_create, can_edit, can_delete, can_export, can_assign_leads, can_access_payments)
values
  ('super_admin','leads', true, true, true, true, true, true, true),
  ('admin','leads', true, true, true, true, true, true, true),
  ('team_leader','leads', true, true, true, false, true, true, false),
  ('telecaller','leads', true, true, true, false, false, false, false),
  ('counselor','leads', true, true, true, false, false, false, false),
  ('accountant','leads', true, false, false, false, false, false, true)
on conflict (role, module) do nothing;

-- ============================================================
-- AUDIT LOG (security requirement: every write is traceable)
-- ============================================================
create table if not exists audit_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references user_profiles(id),
  action text not null, -- 'insert' | 'update' | 'delete'
  table_name text not null,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_log_table on audit_log(table_name, record_id);

-- ============================================================
-- AUTO CONVERSION: Lead -> Student on "admission_confirmed"
-- Carries forward name/mobile/email/city/state/course, keeps lead_id as
-- the conversion-history link, and logs it on the shared timeline.
-- ============================================================
create or replace function fn_convert_lead_to_student()
returns trigger as $$
begin
  if new.status = 'admission_confirmed'
     and (old.status is distinct from new.status) then

    insert into students (
      student_code, lead_id, name, mobile, email, city, state, course_id, admission_date, status
    )
    values (
      'STU-' || upper(substr(new.id::text, 1, 8)),
      new.id, new.name, new.mobile, new.email, new.city, new.state, new.course_id, current_date, 'active'
    )
    on conflict (lead_id) do nothing;

    insert into activity_log (entity_type, entity_id, activity_type, description)
    values ('lead', new.id, 'status_change', 'Lead converted to student on admission confirmation');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_convert_lead_to_student on leads;
create trigger trg_convert_lead_to_student
after update of status on leads
for each row execute function fn_convert_lead_to_student();

-- ============================================================
-- RLS — students/payments are more sensitive than leads, so default to
-- admin/team_leader/accountant visibility; extend per your final policy.
-- ============================================================
alter table courses enable row level security;
alter table students enable row level security;
alter table workshops enable row level security;
alter table workshop_attendees enable row level security;
alter table payments enable row level security;
alter table activity_log enable row level security;
alter table notifications enable row level security;
alter table role_permissions enable row level security;
alter table audit_log enable row level security;

create policy "courses_read_all" on courses for select using (true);
create policy "courses_write_admins" on courses for all using (
  exists (select 1 from user_profiles up where up.id = auth.uid() and up.role in ('super_admin','admin'))
);

create policy "students_visible_to_staff" on students for select using (
  exists (select 1 from user_profiles up where up.id = auth.uid()
    and up.role in ('super_admin','admin','team_leader','counselor','accountant'))
);
create policy "students_write_staff" on students for insert with check (
  exists (select 1 from user_profiles up where up.id = auth.uid()
    and up.role in ('super_admin','admin','team_leader','counselor'))
);
create policy "students_update_staff" on students for update using (
  exists (select 1 from user_profiles up where up.id = auth.uid()
    and up.role in ('super_admin','admin','team_leader','counselor'))
);

create policy "workshops_read_all" on workshops for select using (true);
create policy "workshops_write_admins" on workshops for all using (
  exists (select 1 from user_profiles up where up.id = auth.uid() and up.role in ('super_admin','admin','team_leader'))
);
create policy "workshop_attendees_staff" on workshop_attendees for all using (
  exists (select 1 from user_profiles up where up.id = auth.uid()
    and up.role in ('super_admin','admin','team_leader','counselor'))
);

create policy "payments_restricted" on payments for all using (
  exists (select 1 from user_profiles up where up.id = auth.uid()
    and up.role in ('super_admin','admin','accountant'))
);

create policy "activity_log_visible_to_staff" on activity_log for select using (
  exists (select 1 from user_profiles up where up.id = auth.uid())
);
create policy "activity_log_insert_staff" on activity_log for insert with check (
  exists (select 1 from user_profiles up where up.id = auth.uid())
);

create policy "notifications_owner" on notifications for all using (user_id = auth.uid());

create policy "role_permissions_admin_only" on role_permissions for all using (
  exists (select 1 from user_profiles up where up.id = auth.uid() and up.role in ('super_admin','admin'))
);

create policy "audit_log_admin_only" on audit_log for select using (
  exists (select 1 from user_profiles up where up.id = auth.uid() and up.role in ('super_admin','admin'))
);
