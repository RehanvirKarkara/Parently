export type CareEventCategory =
  | "medication"
  | "checkin"
  | "appointment"
  | "reminder"
  | "activity"
  | "meal"
  | "exercise"
  | "sleep"
  | "health_event";

export type CareEventStatus =
  | "completed"
  | "pending"
  | "missed"
  | "scheduled"
  | "alert";

export interface CareCalendarEvent {
  id: string;
  parentId: string;
  title: string;
  category: CareEventCategory;
  status: CareEventStatus;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h format, e.g. "08:30")
  endTime?: string; // HH:mm (e.g. "09:15")
  details?: string;
  location?: string;
  doctorName?: string;
  dosage?: string;
  metricValue?: string; // e.g. "128/82 mmHg", "7.5h sleep", "4,200 steps"
  isRecurring?: boolean;
  recurrenceRule?: string;
  completedAt?: string;
  historyNote?: string;
  source: "medicine" | "checkin" | "appointment" | "manual";
  sourceId?: string;
}

export interface DayCareSummary {
  date: string;
  totalMedications: number;
  completedMedications: number;
  checkinsTotal: number;
  checkinsCompleted: number;
  activityMinutes: number;
  activitySteps: number;
  upcomingAppointments: number;
  alertsCount: number;
  overallStatus: "excellent" | "good" | "attention" | "concerning";
  statusText: string;
}
