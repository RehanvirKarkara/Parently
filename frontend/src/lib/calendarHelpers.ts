import {
  AlertTriangle,
  Bell,
  Dumbbell,
  Footprints,
  HeartPulse,
  Moon,
  Pill,
  Stethoscope,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { CareEventCategory, CareEventStatus } from "@/types/calendar";

export interface CategoryMeta {
  label: string;
  icon: LucideIcon;
  badgeClass: string;
  dotClass: string;
  cardBorderClass: string;
  cardBgClass: string;
  textClass: string;
}

export const CATEGORY_META: Record<CareEventCategory, CategoryMeta> = {
  medication: {
    label: "Medication",
    icon: Pill,
    badgeClass: "bg-secondary/15 text-secondary border-secondary/30",
    dotClass: "bg-secondary",
    cardBorderClass: "border-secondary/25 hover:border-secondary/40",
    cardBgClass: "bg-secondary/5 hover:bg-secondary/8",
    textClass: "text-secondary",
  },
  checkin: {
    label: "Health Check-in",
    icon: HeartPulse,
    badgeClass: "bg-primary/15 text-primary border-primary/30",
    dotClass: "bg-primary",
    cardBorderClass: "border-primary/25 hover:border-primary/40",
    cardBgClass: "bg-primary/5 hover:bg-primary/8",
    textClass: "text-primary",
  },
  appointment: {
    label: "Doctor Visit",
    icon: Stethoscope,
    badgeClass: "bg-accent/15 text-accent border-accent/30",
    dotClass: "bg-accent",
    cardBorderClass: "border-accent/25 hover:border-accent/40",
    cardBgClass: "bg-accent/5 hover:bg-accent/8",
    textClass: "text-accent",
  },
  reminder: {
    label: "Reminder",
    icon: Bell,
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    dotClass: "bg-amber-500",
    cardBorderClass: "border-amber-500/25 hover:border-amber-500/40",
    cardBgClass: "bg-amber-500/5 hover:bg-amber-500/8",
    textClass: "text-amber-600 dark:text-amber-400",
  },
  activity: {
    label: "Activity",
    icon: Footprints,
    badgeClass: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
    dotClass: "bg-sky-500",
    cardBorderClass: "border-sky-500/25 hover:border-sky-500/40",
    cardBgClass: "bg-sky-500/5 hover:bg-sky-500/8",
    textClass: "text-sky-600 dark:text-sky-400",
  },
  meal: {
    label: "Meal & Nutrition",
    icon: Utensils,
    badgeClass: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
    dotClass: "bg-orange-500",
    cardBorderClass: "border-orange-500/25 hover:border-orange-500/40",
    cardBgClass: "bg-orange-500/5 hover:bg-orange-500/8",
    textClass: "text-orange-600 dark:text-orange-400",
  },
  exercise: {
    label: "Exercise",
    icon: Dumbbell,
    badgeClass: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
    dotClass: "bg-violet-500",
    cardBorderClass: "border-violet-500/25 hover:border-violet-500/40",
    cardBgClass: "bg-violet-500/5 hover:bg-violet-500/8",
    textClass: "text-violet-600 dark:text-violet-400",
  },
  sleep: {
    label: "Sleep",
    icon: Moon,
    badgeClass: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    dotClass: "bg-indigo-500",
    cardBorderClass: "border-indigo-500/25 hover:border-indigo-500/40",
    cardBgClass: "bg-indigo-500/5 hover:bg-indigo-500/8",
    textClass: "text-indigo-600 dark:text-indigo-400",
  },
  health_event: {
    label: "Health Alert",
    icon: AlertTriangle,
    badgeClass: "bg-destructive/15 text-destructive border-destructive/30",
    dotClass: "bg-destructive",
    cardBorderClass: "border-destructive/30 hover:border-destructive/50",
    cardBgClass: "bg-destructive/5 hover:bg-destructive/8",
    textClass: "text-destructive",
  },
};

export interface StatusMeta {
  label: string;
  badgeClass: string;
  dotClass: string;
}

export const STATUS_META: Record<CareEventStatus, StatusMeta> = {
  completed: {
    label: "Completed",
    badgeClass: "bg-secondary/15 text-secondary border-secondary/30",
    dotClass: "bg-secondary",
  },
  pending: {
    label: "Pending",
    badgeClass: "bg-muted/70 text-muted-foreground border-border/60",
    dotClass: "bg-muted-foreground/60",
  },
  scheduled: {
    label: "Scheduled",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    dotClass: "bg-primary",
  },
  missed: {
    label: "Missed",
    badgeClass: "bg-destructive/15 text-destructive border-destructive/30",
    dotClass: "bg-destructive",
  },
  alert: {
    label: "Needs Attention",
    badgeClass: "bg-warning/20 text-warning-foreground border-warning/40 animate-pulse",
    dotClass: "bg-warning",
  },
};

export function formatTimeSlot(timeStr: string): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

export function parseHourFromTime(timeStr: string): number {
  if (!timeStr) return 8;
  const parts = timeStr.split(":");
  return parseInt(parts[0], 10) || 8;
}
