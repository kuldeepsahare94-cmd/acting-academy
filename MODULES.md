# CRM Modules — Fields & Relationships

Covers every module from the master spec and how it maps to the database
(`schema_mobile_subset.sql` + `schema_full_addon.sql`). Mobile app currently
implements Leads, Followups, Dashboard, and Call Logs only — everything
below exists in the schema now so the web portal (and later mobile screens)
have a stable backend to build against.

## Leads
`leads` table.
Fields: name, mobile, alternate_mobile, email, city, state, lead_source,
campaign, course_interested (free text) + course_id (FK → courses, structured),
status, remarks, assigned_user_id, created_at, last_followup_at, next_followup_at.
- **Relationships**: belongs to one `courses` row (optional), one assigned
  `user_profiles` row; has many `call_logs`, `followups`, `activity_log`
  entries; converts into exactly one `students` row.

## Courses
`courses` table.
Fields: name, duration, fees, description, active.
- **Relationships**: one course → many leads, many students.

## Students
`students` table.
Fields: student_code (human-readable ID), lead_id (conversion history link),
name, mobile, email, address, city, state, parent_name, parent_mobile,
course_id, admission_date, batch, status (active/completed/dropped/on_hold).
- **Relationships**: created automatically when a lead's status becomes
  `admission_confirmed` (trigger `trg_convert_lead_to_student`), carrying
  forward name/mobile/email/city/state/course. Belongs to one course; has
  many `payments`, many `workshop_attendees` rows (i.e. many workshops).

## Workshops
`workshops` + `workshop_attendees` tables.
Workshop fields: name, date, start_time, end_time, venue, trainer, capacity.
Attendee fields: workshop_id, student_id, attendance (present/absent/not_marked).
- **Relationships**: many-to-many between `workshops` and `students` via
  `workshop_attendees` — one workshop has many students, one student attends
  many workshops.

## Payments
`payments` table.
Fields: student_id, course_id, amount, due_amount, payment_date, payment_mode,
transaction_number, receipt_number, status (paid/partial/pending).
- **Relationships**: belongs to one student and (optionally) one course.

## Activity Timeline
`activity_log` table — the unified feed for both leads and students.
Fields: entity_type (lead/student), entity_id, activity_type (call, note,
followup, assignment, status_change, payment, workshop_registration),
description, metadata (jsonb), created_by, created_at.
- **Relationships**: polymorphic — entity_type + entity_id point at either
  a `leads` row or a `students` row. `call_logs` and `followups` also still
  exist as their own tables (used directly by the mobile call flow);
  `activity_log` is the merged view everything else feeds into.

## Notifications
`notifications` table.
Fields: user_id, title, body, type (new_lead, lead_assigned,
followup_reminder, missed_followup, payment_due, workshop_tomorrow,
admission_done), related_entity_type/id, read.
- **Relationships**: belongs to one user. Populated by scheduled/edge
  functions (missed followups, payment due, workshop tomorrow) or triggers
  (new lead, lead assigned, admission done) — those functions aren't built
  yet, this is just the storage + the mobile push-token wiring already in
  place.

## Roles & Permissions
`role_permissions` table — one row per (role, module) pair.
Fields: can_view, can_create, can_edit, can_delete, can_export,
can_assign_leads, can_access_payments, can_access_dashboard.
Roles: super_admin, admin, team_leader, telecaller, counselor, accountant.
- Seeded with sensible defaults for the `leads` module only — extend rows
  for students/courses/workshops/payments/reports as the web admin panel's
  permission editor gets built.

## Audit Log
`audit_log` table. Fields: user_id, action, table_name, record_id,
old_data, new_data. Not yet wired to triggers on every table — currently
just the storage; add `AFTER INSERT/UPDATE/DELETE` triggers per table when
you're ready to enforce it everywhere.

## What's still missing
- Web portal screens for all of the above
- Scheduled jobs / Edge Functions that actually populate `notifications`
  (missed followup, payment due, workshop tomorrow reminders)
- Facebook/Instagram lead webhook ingestion into `leads`
- Round-robin auto-assignment logic
- Reports/export (PDF/Excel/CSV) generation
- Global search across leads/students/courses/workshops
