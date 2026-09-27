import { useEffect, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { ParentSelector } from "@/components/shared/ParentSelector";
import { ErrorState } from "@/components/shared/ErrorState";
import { DailyCareOverviewCard } from "@/components/calendar/DailyCareOverviewCard";
import { CalendarDayTimeline } from "@/components/calendar/CalendarDayTimeline";
import { CalendarWeekView } from "@/components/calendar/CalendarWeekView";
import { CalendarMonthView } from "@/components/calendar/CalendarMonthView";
import { CareEventDetailSheet } from "@/components/calendar/CareEventDetailSheet";
import { AddCareEventDialog } from "@/components/calendar/AddCareEventDialog";
import { useCalendarStore } from "@/stores/calendarStore";
import { useHealthLogs, useMedicines, useParents } from "@/hooks/queries";
import { formatDate, toISODate, todayISO } from "@/lib/utils";

const CATEGORY_FILTERS = [
  { id: "all", label: "All Events" },
  { id: "medication", label: "Medications" },
  { id: "checkin", label: "Health Check-ins" },
  { id: "appointment", label: "Doctor Visits" },
  { id: "activity", label: "Activities" },
  { id: "reminder", label: "Reminders" },
  { id: "health_event", label: "Alerts" },
];

export function CalendarPage() {
  const { data: parents, isError, refetch } = useParents();
  const [selectedParentId, setSelectedParentId] = useState<string>("p-mom");

  useEffect(() => {
    if (parents && parents.length > 0 && !parents.some((p) => p.id === selectedParentId)) {
      setSelectedParentId(parents[0].id);
    }
  }, [parents, selectedParentId]);

  const selectedParent = parents?.find((p) => p.id === selectedParentId) ?? parents?.[0];

  // Live queries for real-time medication and check-in sync
  const { data: medicines } = useMedicines(selectedParentId);
  const { data: logs } = useHealthLogs(selectedParentId);

  const {
    events,
    selectedDate,
    viewMode,
    selectedCategory,
    isAddModalOpen,
    setSelectedDate,
    setViewMode,
    setSelectedCategory,
    setIsAddModalOpen,
    syncFromMedicinesAndLogs,
    getDaySummary,
  } = useCalendarStore();

  const [editEventId, setEditEventId] = useState<string | null>(null);

  // Sync real database medicines into calendar store if available
  useEffect(() => {
    if (selectedParentId && medicines && logs) {
      syncFromMedicinesAndLogs(selectedParentId, medicines, logs);
    }
  }, [selectedParentId, medicines, logs, syncFromMedicinesAndLogs]);

  // Filter events by selected parent and category
  const parentEvents = useMemo(() => {
    return events.filter((e) => {
      if (e.parentId !== selectedParentId) return false;
      if (selectedCategory === "all") return true;
      if (selectedCategory === "activity") return e.category === "activity" || e.category === "exercise";
      return e.category === selectedCategory;
    });
  }, [events, selectedParentId, selectedCategory]);

  // Selected date monitoring summary
  const daySummary = useMemo(() => {
    return getDaySummary(selectedParentId, selectedDate);
  }, [selectedParentId, selectedDate, getDaySummary, events]);

  // Date Navigation handlers
  const handlePrev = () => {
    const d = new Date(selectedDate + "T12:00:00Z");
    if (viewMode === "day") {
      d.setUTCDate(d.getUTCDate() - 1);
    } else if (viewMode === "week") {
      d.setUTCDate(d.getUTCDate() - 7);
    } else {
      d.setUTCMonth(d.getUTCMonth() - 1);
    }
    setSelectedDate(toISODate(d));
  };

  const handleNext = () => {
    const d = new Date(selectedDate + "T12:00:00Z");
    if (viewMode === "day") {
      d.setUTCDate(d.getUTCDate() + 1);
    } else if (viewMode === "week") {
      d.setUTCDate(d.getUTCDate() + 7);
    } else {
      d.setUTCMonth(d.getUTCMonth() + 1);
    }
    setSelectedDate(toISODate(d));
  };

  const handleToday = () => {
    setSelectedDate(todayISO());
  };

  // Header Title Formatting
  const formattedNavTitle = useMemo(() => {
    const d = new Date(selectedDate + "T12:00:00Z");
    if (viewMode === "day") {
      return formatDate(selectedDate, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    if (viewMode === "month") {
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    // Week
    const dayOfWeek = d.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() + mondayOffset);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    return `${formatDate(toISODate(monday), { month: "short", day: "numeric" })} – ${formatDate(
      toISODate(sunday),
      { month: "short", day: "numeric", year: "numeric" },
    )}`;
  }, [selectedDate, viewMode]);

  if (isError) {
    return <ErrorState title="Care Calendar is currently unavailable" onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        eyebrow="Routine & Monitoring"
        title="Care Calendar"
        description="Unified family timeline for medications, doctor appointments, daily check-ins, and activity."
        actions={
          <Button
            onClick={() => {
              setEditEventId(null);
              setIsAddModalOpen(true);
            }}
            className="shadow-brand"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Care Event
          </Button>
        }
      />

      {/* Parent Selector */}
      {parents && parents.length > 0 && (
        <ParentSelector
          parents={parents}
          activeId={selectedParentId}
          onChange={setSelectedParentId}
        />
      )}

      {/* Daily Monitoring Signal Banner */}
      <DailyCareOverviewCard
        summary={daySummary}
        parentName={selectedParent?.first_name ?? "Parent"}
      />

      {/* Calendar Toolbar: Nav + View Modes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/85 p-3 sm:p-4 shadow-soft-sm backdrop-blur-xl">
        {/* Left: Date controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className={`font-semibold text-xs h-9 ${
              selectedDate === todayISO() ? "border-primary/50 text-primary bg-primary/8" : ""
            }`}
          >
            Today
          </Button>

          <div className="flex items-center rounded-xl border border-border/60 bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={handlePrev}
              className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
              aria-label="Previous period"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
              aria-label="Next period"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <span className="font-heading text-sm sm:text-base font-bold text-foreground pl-1.5">
            {formattedNavTitle}
          </span>
        </div>

        {/* Right: View Mode Toggle */}
        <div className="flex items-center self-end sm:self-center rounded-xl border border-border/70 bg-muted/40 p-1 shadow-soft-xs">
          {(["day", "week", "month"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all duration-200 select-none ${
                viewMode === mode
                  ? "bg-card text-foreground shadow-soft-xs ring-1 ring-border/80"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setSelectedCategory(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
              selectedCategory === f.id
                ? "bg-primary text-primary-foreground border-primary shadow-brand-xs"
                : "border-border/60 bg-card/70 text-muted-foreground hover:border-border/90 hover:text-foreground hover:bg-card"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Calendar Views */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${viewMode}-${selectedDate}-${selectedCategory}-${selectedParentId}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {viewMode === "day" && (
            <CalendarDayTimeline
              date={selectedDate}
              events={parentEvents.filter((e) => e.date === selectedDate)}
              onAddEvent={() => {
                setEditEventId(null);
                setIsAddModalOpen(true);
              }}
            />
          )}

          {viewMode === "week" && (
            <CalendarWeekView
              currentDate={selectedDate}
              events={parentEvents}
              onSelectDate={(date) => setSelectedDate(date)}
              onAddEvent={() => {
                setEditEventId(null);
                setIsAddModalOpen(true);
              }}
            />
          )}

          {viewMode === "month" && (
            <CalendarMonthView
              currentDate={selectedDate}
              events={parentEvents}
              onSelectDate={(date) => setSelectedDate(date)}
              onAddEvent={() => {
                setEditEventId(null);
                setIsAddModalOpen(true);
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Event Detail Sheet Drawer */}
      <CareEventDetailSheet
        onEditRequested={(eventId) => {
          setEditEventId(eventId);
          setIsAddModalOpen(true);
        }}
      />

      {/* Add / Edit Event Dialog Modal */}
      {isAddModalOpen && (
        <AddCareEventDialog
          parentId={selectedParentId}
          parentName={selectedParent?.first_name}
          editEventId={editEventId}
          onClose={() => {
            setEditEventId(null);
            setIsAddModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
export default CalendarPage;
