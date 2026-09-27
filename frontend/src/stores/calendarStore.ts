import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CareCalendarEvent, DayCareSummary } from "@/types/calendar";
import type { HealthLog, Medicine } from "@/types";
import { daysAgoISO, todayISO } from "@/lib/utils";

interface CalendarState {
  events: CareCalendarEvent[];
  selectedDate: string; // YYYY-MM-DD
  viewMode: "day" | "week" | "month";
  selectedCategory: string; // "all" or specific CareEventCategory
  selectedEventId: string | null;
  isDetailOpen: boolean;
  isAddModalOpen: boolean;

  // Actions
  setSelectedDate: (date: string) => void;
  setViewMode: (mode: "day" | "week" | "month") => void;
  setSelectedCategory: (category: string) => void;
  setSelectedEventId: (id: string | null) => void;
  setIsDetailOpen: (open: boolean) => void;
  setIsAddModalOpen: (open: boolean) => void;
  addEvent: (event: Omit<CareCalendarEvent, "id">) => CareCalendarEvent;
  updateEvent: (id: string, updates: Partial<CareCalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  toggleEventCompleted: (id: string) => void;
  syncFromMedicinesAndLogs: (parentId: string, medicines: Medicine[], logs: HealthLog[]) => void;
  getDaySummary: (parentId: string, date: string) => DayCareSummary;
}

function generateInitialEvents(): CareCalendarEvent[] {
  const today = todayISO();
  const yesterday = daysAgoISO(1);
  const twoDaysAgo = daysAgoISO(2);
  const tomorrow = daysAgoISO(-1);
  const inTwoDays = daysAgoISO(-2);
  const inThreeDays = daysAgoISO(-3);

  return [
    // Today - Carol Morgan (p-mom)
    {
      id: "ev-today-med-1",
      parentId: "p-mom",
      title: "Metformin 500 mg",
      category: "medication",
      status: "completed",
      date: today,
      startTime: "08:00",
      dosage: "500 mg with breakfast",
      details: "Blood glucose management pill taken with food and water.",
      completedAt: `${today}T08:05:00Z`,
      source: "medicine",
    },
    {
      id: "ev-today-checkin-1",
      parentId: "p-mom",
      title: "Morning Wellness Check-in",
      category: "checkin",
      status: "completed",
      date: today,
      startTime: "08:30",
      details: "Carol reported 7.5 hours of sound sleep, mood feeling calm and refreshed.",
      metricValue: "7.5h sleep",
      completedAt: `${today}T08:32:00Z`,
      source: "checkin",
    },
    {
      id: "ev-today-act-1",
      parentId: "p-mom",
      title: "Garden Stroll & Sunshine Walk",
      category: "activity",
      status: "completed",
      date: today,
      startTime: "09:45",
      endTime: "10:15",
      details: "Gentle morning walk around the botanical trail with daughter.",
      metricValue: "2,450 steps · 30 min",
      completedAt: `${today}T10:15:00Z`,
      source: "manual",
    },
    {
      id: "ev-today-med-2",
      parentId: "p-mom",
      title: "Amlodipine 5 mg",
      category: "medication",
      status: "completed",
      date: today,
      startTime: "12:30",
      dosage: "5 mg after lunch",
      details: "Daily blood pressure stabilizer.",
      completedAt: `${today}T12:35:00Z`,
      source: "medicine",
    },
    {
      id: "ev-today-rem-1",
      parentId: "p-mom",
      title: "Afternoon Blood Pressure Check",
      category: "reminder",
      status: "completed",
      date: today,
      startTime: "14:15",
      details: "Automated arm cuff reading recorded by Carol.",
      metricValue: "122/80 mmHg (Normal)",
      completedAt: `${today}T14:18:00Z`,
      historyNote: "Consistent with 14-day average systolic baseline.",
      source: "manual",
    },
    {
      id: "ev-today-appt-1",
      parentId: "p-mom",
      title: "Dr. Evelyn Reed — Cardiology Consult",
      category: "appointment",
      status: "scheduled",
      date: today,
      startTime: "15:30",
      endTime: "16:15",
      doctorName: "Dr. Evelyn Reed, MD",
      location: "St. Mary's Medical Plaza, Suite 410",
      details: "Quarterly follow-up for blood pressure medication titration and EKG review.",
      historyNote: "Please bring blood pressure log and current prescription bottles.",
      source: "appointment",
    },
    {
      id: "ev-today-checkin-2",
      parentId: "p-mom",
      title: "Evening Health Check-in",
      category: "checkin",
      status: "pending",
      date: today,
      startTime: "19:30",
      details: "Log day rating, dinner nutrition, and evening steps.",
      source: "checkin",
    },
    {
      id: "ev-today-med-3",
      parentId: "p-mom",
      title: "Atorvastatin 20 mg",
      category: "medication",
      status: "pending",
      date: today,
      startTime: "21:30",
      dosage: "20 mg before bed",
      details: "Cholesterol support medication taken at night.",
      source: "medicine",
    },

    // Yesterday - Carol Morgan
    {
      id: "ev-yest-med-1",
      parentId: "p-mom",
      title: "Metformin 500 mg",
      category: "medication",
      status: "completed",
      date: yesterday,
      startTime: "08:00",
      completedAt: `${yesterday}T08:10:00Z`,
      source: "medicine",
    },
    {
      id: "ev-yest-checkin-1",
      parentId: "p-mom",
      title: "Morning Check-in",
      category: "checkin",
      status: "completed",
      date: yesterday,
      startTime: "08:30",
      metricValue: "7.0h sleep",
      completedAt: `${yesterday}T08:35:00Z`,
      source: "checkin",
    },
    {
      id: "ev-yest-act-1",
      parentId: "p-mom",
      title: "Senior Gentle Yoga",
      category: "exercise",
      status: "completed",
      date: yesterday,
      startTime: "11:00",
      metricValue: "40 min session",
      completedAt: `${yesterday}T11:45:00Z`,
      source: "manual",
    },
    {
      id: "ev-yest-med-2",
      parentId: "p-mom",
      title: "Amlodipine 5 mg",
      category: "medication",
      status: "completed",
      date: yesterday,
      startTime: "12:30",
      completedAt: `${yesterday}T12:40:00Z`,
      source: "medicine",
    },
    {
      id: "ev-yest-checkin-2",
      parentId: "p-mom",
      title: "Evening Check-in",
      category: "checkin",
      status: "completed",
      date: yesterday,
      startTime: "20:00",
      metricValue: "Day rating: 9/10",
      completedAt: `${yesterday}T20:15:00Z`,
      source: "checkin",
    },
    {
      id: "ev-yest-med-3",
      parentId: "p-mom",
      title: "Atorvastatin 20 mg",
      category: "medication",
      status: "completed",
      date: yesterday,
      startTime: "21:30",
      completedAt: `${yesterday}T21:35:00Z`,
      source: "medicine",
    },

    // Two days ago - Carol Morgan (with alert)
    {
      id: "ev-2days-alert-1",
      parentId: "p-mom",
      title: "Elevated Blood Pressure Alert",
      category: "health_event",
      status: "alert",
      date: twoDaysAgo,
      startTime: "16:00",
      metricValue: "142/92 mmHg",
      details: "Mild afternoon dizziness recorded. Carol rested with hydration and recovered within 40 minutes.",
      source: "manual",
    },
    {
      id: "ev-2days-med-missed",
      parentId: "p-mom",
      title: "Amlodipine 5 mg (Missed Dose)",
      category: "medication",
      status: "missed",
      date: twoDaysAgo,
      startTime: "12:30",
      details: "Dose delayed due to family outing. Caregiver notified.",
      source: "medicine",
    },

    // Tomorrow & Upcoming
    {
      id: "ev-tom-bloodwork",
      parentId: "p-mom",
      title: "Quest Diagnostics — Fasting Blood Panel",
      category: "appointment",
      status: "scheduled",
      date: tomorrow,
      startTime: "08:45",
      endTime: "09:30",
      location: "Quest Diagnostics, 102 Metro Ave",
      details: "Comprehensive metabolic panel, HbA1c, and lipid profiling. Remember to fast 8 hours prior.",
      source: "appointment",
    },
    {
      id: "ev-in2days-eye",
      parentId: "p-mom",
      title: "Vision Care Center — Dilated Eye Exam",
      category: "appointment",
      status: "scheduled",
      date: inTwoDays,
      startTime: "14:00",
      endTime: "15:00",
      doctorName: "Dr. Marcus Vance, OD",
      location: "Vision Center, Downtown Suite 2B",
      details: "Annual diabetic eye retinopathy screening. Driving assistance arranged.",
      source: "appointment",
    },
    {
      id: "ev-in3days-family",
      parentId: "p-mom",
      title: "Family Sunday Brunch & Memory Sharing",
      category: "activity",
      status: "scheduled",
      date: inThreeDays,
      startTime: "11:30",
      endTime: "13:30",
      location: "Carol's House",
      details: "Weekly family get-together and answering the Legacy memory questions together.",
      source: "manual",
    },

    // Robert Morgan (p-dad) demo entries
    {
      id: "ev-dad-med-1",
      parentId: "p-dad",
      title: "Metoprolol 25 mg",
      category: "medication",
      status: "completed",
      date: today,
      startTime: "08:00",
      dosage: "25 mg with breakfast",
      details: "Heart rate regulation.",
      completedAt: `${today}T08:15:00Z`,
      source: "medicine",
    },
    {
      id: "ev-dad-walk-1",
      parentId: "p-dad",
      title: "Morning Park Power Walk",
      category: "activity",
      status: "completed",
      date: today,
      startTime: "09:00",
      metricValue: "3,800 steps · 45 min",
      completedAt: `${today}T09:45:00Z`,
      source: "manual",
    },
    {
      id: "ev-dad-checkin-1",
      parentId: "p-dad",
      title: "Morning Check-in",
      category: "checkin",
      status: "completed",
      date: today,
      startTime: "09:50",
      metricValue: "8.0h sleep",
      completedAt: `${today}T09:52:00Z`,
      source: "checkin",
    },
    {
      id: "ev-dad-physio",
      parentId: "p-dad",
      title: "Physical Therapy — Knee Rehabilitation",
      category: "appointment",
      status: "scheduled",
      date: today,
      startTime: "14:00",
      doctorName: "Lisa Taylor, DPT",
      location: "Peak Motion Physical Therapy",
      details: "Lower extremity mobility exercises following minor joint stiffness.",
      source: "appointment",
    },
  ];
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      events: generateInitialEvents(),
      selectedDate: todayISO(),
      viewMode: "week",
      selectedCategory: "all",
      selectedEventId: null,
      isDetailOpen: false,
      isAddModalOpen: false,

      setSelectedDate: (date) => set({ selectedDate: date }),
      setViewMode: (viewMode) => set({ viewMode }),
      setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
      setSelectedEventId: (id) => set({ selectedEventId: id, isDetailOpen: Boolean(id) }),
      setIsDetailOpen: (isDetailOpen) => set({ isDetailOpen }),
      setIsAddModalOpen: (isAddModalOpen) => set({ isAddModalOpen }),

      addEvent: (eventData) => {
        const newEvent: CareCalendarEvent = {
          ...eventData,
          id: `ev-manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        };
        set((state) => ({
          events: [newEvent, ...state.events],
          isAddModalOpen: false,
        }));
        return newEvent;
      },

      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        }));
      },

      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
          isDetailOpen: state.selectedEventId === id ? false : state.isDetailOpen,
          selectedEventId: state.selectedEventId === id ? null : state.selectedEventId,
        }));
      },

      toggleEventCompleted: (id) => {
        set((state) => ({
          events: state.events.map((e) => {
            if (e.id !== id) return e;
            const isCompleted = e.status === "completed";
            return {
              ...e,
              status: isCompleted ? "pending" : "completed",
              completedAt: isCompleted ? undefined : new Date().toISOString(),
            };
          }),
        }));
      },

      syncFromMedicinesAndLogs: (parentId, medicines, _logs) => {
        // Intelligently merges medicines from the API if not already represented
        const currentEvents = get().events;
        const today = todayISO();
        const newEvents: CareCalendarEvent[] = [];

        // Check if today's medicines exist in store
        medicines.forEach((med) => {
          const exists = currentEvents.some(
            (e) =>
              e.parentId === parentId &&
              e.date === today &&
              e.source === "medicine" &&
              (e.sourceId === med.id || e.title.toLowerCase().includes(med.name.toLowerCase())),
          );
          if (!exists) {
            newEvents.push({
              id: `sync-med-${med.id}-${today}`,
              parentId,
              title: `${med.name} ${med.dosage ?? ""}`.trim(),
              category: "medication",
              status: "scheduled",
              date: today,
              startTime: med.time ? med.time.slice(0, 5) : "09:00",
              dosage: `${med.dosage ?? ""} · ${med.frequency ?? ""}`,
              details: med.instructions ?? undefined,
              source: "medicine",
              sourceId: med.id,
            });
          }
        });

        if (newEvents.length > 0) {
          set((state) => ({
            events: [...state.events, ...newEvents],
          }));
        }
      },

      getDaySummary: (parentId, date) => {
        const events = get().events.filter((e) => e.parentId === parentId && e.date === date);

        const meds = events.filter((e) => e.category === "medication");
        const totalMedications = meds.length;
        const completedMedications = meds.filter((e) => e.status === "completed").length;

        const checkins = events.filter((e) => e.category === "checkin");
        const checkinsTotal = checkins.length || 3;
        const checkinsCompleted = checkins.filter((e) => e.status === "completed").length;

        const appts = events.filter((e) => e.category === "appointment");
        const upcomingAppointments = appts.filter((e) => e.status === "scheduled" || e.status === "pending").length;

        const alerts = events.filter((e) => e.category === "health_event" || e.status === "alert" || e.status === "missed");
        const alertsCount = alerts.length;

        let activityMinutes = 0;
        let activitySteps = 0;
        events
          .filter((e) => e.category === "activity" || e.category === "exercise")
          .forEach((e) => {
            if (e.metricValue?.includes("min")) {
              const m = parseInt(e.metricValue, 10);
              if (!isNaN(m)) activityMinutes += m;
            }
            if (e.metricValue?.includes("step")) {
              const s = parseInt(e.metricValue.replace(/,/g, ""), 10);
              if (!isNaN(s)) activitySteps += s;
            }
          });

        let overallStatus: "excellent" | "good" | "attention" | "concerning" = "good";
        let statusText = "Daily routine on track";

        if (alertsCount > 0) {
          overallStatus = alertsCount > 1 ? "concerning" : "attention";
          statusText = `${alertsCount} item${alertsCount > 1 ? "s" : ""} need caregiver attention`;
        } else if (totalMedications > 0 && completedMedications === totalMedications && checkinsCompleted >= 2) {
          overallStatus = "excellent";
          statusText = "Excellent adherence · All essentials logged";
        } else if (upcomingAppointments > 0) {
          overallStatus = "good";
          statusText = `${upcomingAppointments} upcoming appointment scheduled`;
        }

        return {
          date,
          totalMedications,
          completedMedications,
          checkinsTotal,
          checkinsCompleted,
          activityMinutes: activityMinutes || 30,
          activitySteps: activitySteps || 2800,
          upcomingAppointments,
          alertsCount,
          overallStatus,
          statusText,
        };
      },
    }),
    {
      name: "parently-care-calendar-storage",
      partialize: (state) => ({
        events: state.events,
        viewMode: state.viewMode,
        selectedCategory: state.selectedCategory,
      }),
    },
  ),
);
