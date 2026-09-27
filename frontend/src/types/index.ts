export type TimeOfDay = "morning" | "afternoon" | "evening";

export type UserRole = "creator" | "sibling";

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  phone?: string | null;
  avatar_color?: string;
  avatar_url?: string | null;
}

export interface Family {
  id: string;
  name: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: UserRole;
  joined_at: string;
  is_active: boolean;
}

export interface Parent {
  id: string;
  family_id: string;
  first_name: string;
  last_name: string;
  email: string;
  medical_conditions: string | null;
  allergies: string | null;
  date_of_birth: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  phone?: string | null;
  address?: string | null;
  blood_group?: string | null;
  avatar_color?: string;
  avatar_url?: string | null;
  goals?: string[];
}

export interface HealthLog {
  id: string;
  parent_id: string;
  log_date: string;
  log_time_of_day: TimeOfDay;
  hours_slept: number | null;
  meds_taken: boolean | null;
  breakfast_details: string | null;
  lunch_details: string | null;
  steps_walked_afternoon: number | null;
  workout_details: string | null;
  snacks_dinner_details: string | null;
  steps_walked_evening: number | null;
  day_rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface Medicine {
  id: string;
  parent_id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  instructions: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  time?: string;
  color?: string;
}

export interface Report {
  id: string;
  family_id: string;
  report_type: "weekly" | "monthly";
  report_period_start: string;
  report_period_end: string;
  content: string;
  generated_at: string;
}

export type NotificationType =
  | "missed_checkin_parent"
  | "missed_checkin_child"
  | "medicine_reminder"
  | "checkin_reminder"
  | "report_ready"
  | "legacy_shared"
  | "parent_alert"
  | "family_activity"
  | "quiz_invite";

export interface AppNotification {
  id: string;
  recipient_user_id: string | null;
  recipient_parent_id: string | null;
  type: NotificationType;
  message: string;
  is_read: boolean;
  sent_at: string;
  related_log_id: string | null;
  title?: string;
}

export interface HealthInsightRef {
  kind: "sleep" | "meds" | "steps" | "rating" | "nutrition" | "alert";
  title: string;
  value?: string | number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  insight?: HealthInsightRef | null;
}

export interface AIConversation {
  id: string;
  user_id: string | null;
  parent_id: string | null;
  conversation_type: "parent_chatbot" | "offspring_chatbot";
  message_history: ChatMessage[];
  started_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  question_text: string;
  category: string | null;
  options: string[];
}

export interface QuizAnswer {
  id: string;
  quiz_question_id: string;
  family_member_id: string;
  answer_text: string;
  answered_at: string;
}

export interface LegacyQuestion {
  id: string;
  question_text: string;
  created_at: string;
}

export interface LegacyAnswer {
  id: string;
  legacy_question_id: string;
  parent_id: string;
  answer_text: string;
  answered_at: string;
}

export interface OTPCode {
  id: string;
  email: string;
  code: string;
  purpose: "parent_invite" | "email_verification" | "password_reset";
  expires_at: string;
  created_at: string;
}

/* ---------- Derived / frontend-only models ---------- */

export type AppMode = "offspring" | "parent";

export type ParentIdentity = "mom" | "dad";

export interface DashboardStats {
  dailyHealthScore: number;
  scoreDelta: number;
  adherenceRate: number;
  adherenceDelta: number;
  avgSleep: number;
  sleepDelta: number;
  activeDays: number;
  activeDaysDelta: number;
  medsDueToday: number;
}

export interface TrendPoint {
  date: string;
  label: string;
  value: number | null;
}

export interface ChartSeries {
  name: string;
  data: TrendPoint[];
}

export interface SiblingInvite {
  email: string;
  status: "pending" | "accepted" | "expired";
  invited_at: string;
}
