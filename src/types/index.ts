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

export interface Course {
  id: string;
  name: string;
  duration: string | null;
  fees: number;
  description: string | null;
  active: boolean;
  created_at: string;
}

export type StudentStatus = "active" | "completed" | "dropped" | "on_hold";

export interface Student {
  id: string;
  student_code: string;
  lead_id: string | null;
  name: string;
  mobile: string;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  parent_name: string | null;
  parent_mobile: string | null;
  course_id: string | null;
  admission_date: string;
  batch: string | null;
  status: StudentStatus;
  created_at: string;
}

export interface Workshop {
  id: string;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  venue: string | null;
  trainer: string | null;
  capacity: number | null;
  created_at: string;
}

export type Attendance = "present" | "absent" | "not_marked";

export interface WorkshopAttendee {
  id: string;
  workshop_id: string;
  student_id: string;
  attendance: Attendance;
  registered_at: string;
}

export type PaymentStatus = "paid" | "partial" | "pending";

export interface Payment {
  id: string;
  student_id: string;
  course_id: string | null;
  amount: number;
  due_amount: number;
  payment_date: string;
  payment_mode: string | null;
  transaction_number: string | null;
  receipt_number: string | null;
  status: PaymentStatus;
  created_at: string;
}
