export const APP_NAME = "Parently";
export const APP_TAGLINE = "Family health, together.";

export const CHECKIN_WINDOWS = {
  morning: {
    label: "Morning",
    time: "6:00 – 11:00",
    icon: "sunrise",
    description: "Sleep, medicine, and breakfast",
  },
  afternoon: {
    label: "Afternoon",
    time: "12:00 – 16:00",
    icon: "sun",
    description: "Lunch, steps, and activity",
  },
  evening: {
    label: "Evening",
    time: "17:00 – 21:00",
    icon: "moon",
    description: "Dinner, steps, and how the day went",
  },
} as const;

export const DAY_RATING_LABELS: Record<number, string> = {
  1: "Really tough",
  2: "Difficult",
  3: "Rough",
  4: "Below average",
  5: "Okay",
  6: "Decent",
  7: "Good",
  8: "Very good",
  9: "Great",
  10: "Wonderful",
};

export const PARENT_ROLE = "parent";
export const OFFS_PRING_ROLE = "offspring";

export const navItems = {
  dashboard: { label: "Dashboard", icon: "LayoutDashboard" },
  family: { label: "Family", icon: "Heart" },
  health: { label: "Health Logs", icon: "Activity" },
  medicines: { label: "Medicines", icon: "Pill" },
  ai: { label: "AI Assistant", icon: "Sparkles" },
  reports: { label: "Reports", icon: "FileText" },
  settings: { label: "Settings", icon: "Settings" },
} as const;

export const parentNavItems = {
  home: { label: "Home", icon: "Home" },
  checkins: { label: "Check-ins", icon: "ClipboardCheck" },
  ai: { label: "Health Coach", icon: "Sparkles" },
  legacy: { label: "Legacy", icon: "BookOpen" },
  health: { label: "My Health", icon: "HeartPulse" },
} as const;
