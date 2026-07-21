// Core domain types. These mirror the Postgres/Supabase schema
// (leads, call_logs, followups) so the app and backend stay in sync.

export type LeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "not_interested"
  | "followup_scheduled"
  | "admission_confirmed"
  | "lost";

export interface Lead {
  id: string;
  name: string;
  mobile: string;
  alternate_mobile: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  lead_source: string | null;
  campaign: string | null;
  course_interested: string | null;
  status: LeadStatus;
  remarks: string | null;
  assigned_user_id: string | null;
  created_at: string;
  last_followup_at: string | null;
  next_followup_at: string | null;
}

export type CallOutcome =
  | "connected_interested"
  | "connected_not_interested"
  | "no_answer"
  | "switched_off"
  | "wrong_number"
  | "call_back_later";

export interface CallLog {
  id: string;
  lead_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  notes: string;
  outcome: CallOutcome;
  created_followup_id: string | null;
}

export type FollowupPriority = "low" | "medium" | "high";

export interface Followup {
  id: string;
  lead_id: string;
  user_id: string;
  date: string; // ISO date
  time: string; // HH:mm
  type: "call" | "meeting" | "whatsapp" | "email";
  priority: FollowupPriority;
  notes: string | null;
  completed: boolean;
  created_at: string;
}

export interface AppUser {
  id: string;
  full_name: string;
  role:
    | "super_admin"
    | "admin"
    | "team_leader"
    | "telecaller"
    | "counselor"
    | "accountant";
  email: string;
}
