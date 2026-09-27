import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Clock,
  MapPin,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { useCalendarStore } from "@/stores/calendarStore";
import { CATEGORY_META, STATUS_META, formatTimeSlot } from "@/lib/calendarHelpers";
import { formatDate, todayISO } from "@/lib/utils";
import type { CareCalendarEvent } from "@/types/calendar";

interface CalendarDayTimelineProps {
  date: string;
  events: CareCalendarEvent[];
  onAddEvent: () => void;
}

export function CalendarDayTimeline({ date, events, onAddEvent }: CalendarDayTimelineProps) {
  const { setSelectedEventId, toggleEventCompleted } = useCalendarStore();
  const isToday = date === todayISO();

  // Current time string for today indicator
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");

  useEffect(() => {
    if (!isToday) {
      setCurrentTimeStr("");
      return;
    }
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [isToday]);

  // Sort events by startTime
  const sortedEvents = [...events].sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (sortedEvents.length === 0) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card/60 p-8 shadow-soft-sm backdrop-blur-md">
        <EmptyState
          icon={Clock}
          title="No scheduled care activities"
          description={`There are no appointments, medications, or check-ins scheduled for ${formatDate(date, { month: "short", day: "numeric" })}.`}
          actionLabel="+ Add Event"
          onAction={onAddEvent}
        />
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl border border-border/70 bg-card/75 p-4 sm:p-6 shadow-soft-sm backdrop-blur-xl">
      {isToday && currentTimeStr && (
        <div className="mb-4 flex items-center justify-between px-3.5 py-2 rounded-xl bg-primary/8 border border-primary/20 text-xs font-semibold text-primary">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span>Current Time Indicator</span>
          </div>
          <span className="font-metric font-bold tracking-wide">{currentTimeStr}</span>
        </div>
      )}
      <div className="space-y-4">
        {sortedEvents.map((event, idx) => {
          const categoryMeta = CATEGORY_META[event.category] ?? CATEGORY_META.reminder;
          const statusMeta = STATUS_META[event.status] ?? STATUS_META.pending;
          const CategoryIcon = categoryMeta.icon;
          const isCompleted = event.status === "completed";

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border p-4 transition-all duration-200 cursor-pointer shadow-soft-xs hover:shadow-soft ${
                isCompleted
                  ? "border-border/60 bg-muted/30 opacity-85 hover:opacity-100"
                  : `${categoryMeta.cardBorderClass} ${categoryMeta.cardBgClass}`
              }`}
              onClick={() => setSelectedEventId(event.id)}
            >
              {/* Left Details */}
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                {/* Checkbox button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleEventCompleted(event.id);
                  }}
                  aria-label={isCompleted ? "Mark incomplete" : "Mark completed"}
                  className={`mt-0.5 size-7 rounded-lg border flex items-center justify-center transition-all duration-200 shrink-0 ${
                    isCompleted
                      ? "bg-secondary border-secondary text-secondary-foreground shadow-mint-xs"
                      : "border-border/80 bg-card hover:border-primary text-transparent hover:text-muted-foreground"
                  }`}
                >
                  <Check className="h-4 w-4 stroke-[2.5]" />
                </button>

                {/* Category Icon */}
                <div
                  className={`size-10 rounded-xl flex items-center justify-center shrink-0 border ${categoryMeta.badgeClass}`}
                >
                  <CategoryIcon className="h-5 w-5" />
                </div>

                {/* Title & Metadata */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-metric text-xs font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                      {formatTimeSlot(event.startTime)}
                      {event.endTime && ` – ${formatTimeSlot(event.endTime)}`}
                    </span>

                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${categoryMeta.badgeClass}`}
                    >
                      {categoryMeta.label}
                    </span>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${statusMeta.badgeClass}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>

                  <h3
                    className={`font-heading text-base font-bold tracking-tight truncate ${
                      isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {event.title}
                  </h3>

                  {/* Supplemental Subtitle / Location / Doctor / Dosage */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {event.dosage && (
                      <span className="font-semibold text-foreground/80">
                        {event.dosage}
                      </span>
                    )}
                    {event.doctorName && (
                      <span className="flex items-center gap-1 text-foreground/80">
                        <Stethoscope className="h-3 w-3 text-accent" />
                        {event.doctorName}
                      </span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-primary" />
                        {event.location}
                      </span>
                    )}
                    {event.details && !event.doctorName && !event.dosage && (
                      <span className="truncate max-w-md">{event.details}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Metric Pill / Quick Click */}
              <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                {event.metricValue && (
                  <span className="font-metric text-xs font-bold px-2.5 py-1 rounded-lg bg-card/90 border border-border/60 text-foreground shadow-soft-xs">
                    {event.metricValue}
                  </span>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground group-hover:text-primary transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEventId(event.id);
                  }}
                >
                  View Details →
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
