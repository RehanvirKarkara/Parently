import { Check } from "lucide-react";
import { useCalendarStore } from "@/stores/calendarStore";
import { CATEGORY_META, formatTimeSlot } from "@/lib/calendarHelpers";
import { toISODate, todayISO } from "@/lib/utils";
import type { CareCalendarEvent } from "@/types/calendar";

interface CalendarWeekViewProps {
  currentDate: string; // YYYY-MM-DD
  events: CareCalendarEvent[];
  onSelectDate: (date: string) => void;
  onAddEvent?: () => void;
}

// Given an ISO date, return the 7 days of its Monday-Sunday week
function getDaysInWeek(dateStr: string): Date[] {
  const d = new Date(dateStr + "T12:00:00Z");
  const dayOfWeek = d.getUTCDay(); // 0 is Sunday, 1 is Monday...
  // Normalize Monday as day 0
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + mondayOffset);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setUTCDate(monday.getUTCDate() + i);
    days.push(day);
  }
  return days;
}

export function CalendarWeekView({
  currentDate,
  events,
  onSelectDate,
}: CalendarWeekViewProps) {
  const { setSelectedEventId, toggleEventCompleted } = useCalendarStore();
  const weekDays = getDaysInWeek(currentDate);
  const today = todayISO();

  return (
    <div className="space-y-4">
      {/* 7-Day Header Strip */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-3 rounded-2xl border border-border/70 bg-card/80 p-2 sm:p-3 shadow-soft-sm backdrop-blur-xl">
        {weekDays.map((dayDate) => {
          const iso = toISODate(dayDate);
          const isSelected = iso === currentDate;
          const isCurrentToday = iso === today;
          const dayName = dayDate.toLocaleDateString("en-US", { weekday: "short" });
          const dayNum = dayDate.getDate();

          const dayEvents = events.filter((e) => e.date === iso);
          const hasAlert = dayEvents.some((e) => e.status === "alert" || e.category === "health_event");
          const completedCount = dayEvents.filter((e) => e.status === "completed").length;

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate(iso)}
              className={`relative flex flex-col items-center justify-between py-2 sm:py-3 px-1 rounded-xl transition-all duration-200 select-none ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-brand ring-2 ring-primary/20 scale-[1.02]"
                  : isCurrentToday
                    ? "border border-primary/30 bg-primary/8 text-foreground hover:bg-primary/12"
                    : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">
                {dayName}
              </span>

              <span
                className={`text-sm sm:text-lg font-bold font-heading my-0.5 ${
                  isSelected ? "text-primary-foreground" : "text-foreground"
                }`}
              >
                {dayNum}
              </span>

              {/* Event indicators */}
              <div className="flex items-center gap-1 h-2">
                {hasAlert ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                ) : dayEvents.length > 0 ? (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isSelected
                        ? "bg-white"
                        : completedCount === dayEvents.length
                          ? "bg-secondary"
                          : "bg-primary"
                    }`}
                  />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-transparent" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Week Day Columns / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDays.map((dayDate) => {
          const iso = toISODate(dayDate);
          const isSelected = iso === currentDate;
          const isCurrentToday = iso === today;
          const dayName = dayDate.toLocaleDateString("en-US", { weekday: "short" });
          const dayNum = dayDate.getDate();

          const dayEvents = events
            .filter((e) => e.date === iso)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          return (
            <div
              key={iso}
              className={`rounded-2xl border transition-all duration-200 p-3 flex flex-col min-h-[220px] md:min-h-[460px] ${
                isSelected
                  ? "border-primary/40 bg-card/95 shadow-soft ring-1 ring-primary/20"
                  : "border-border/60 bg-card/65 hover:border-border/90 hover:bg-card/85"
              }`}
              onClick={() => onSelectDate(iso)}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-bold ${
                      isCurrentToday ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {dayName} {dayNum}
                  </span>
                  {isCurrentToday && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary">
                      Today
                    </span>
                  )}
                </div>

                <span className="text-[10px] font-medium text-muted-foreground">
                  {dayEvents.length} items
                </span>
              </div>

              {/* Event Stack */}
              <div className="flex-1 space-y-2 overflow-y-auto">
                {dayEvents.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-6 text-center text-muted-foreground/60 text-xs">
                    <span>No care events</span>
                  </div>
                ) : (
                  dayEvents.map((event) => {
                    const cat = CATEGORY_META[event.category] ?? CATEGORY_META.reminder;
                    const Icon = cat.icon;
                    const isCompleted = event.status === "completed";

                    return (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventId(event.id);
                        }}
                        className={`group relative rounded-xl border p-2 text-left transition-all duration-200 cursor-pointer shadow-soft-xs hover:shadow-soft ${
                          isCompleted
                            ? "border-border/50 bg-muted/30 opacity-75 hover:opacity-100"
                            : `${cat.cardBorderClass} ${cat.cardBgClass}`
                        }`}
                      >
                        <div className="flex items-start gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleEventCompleted(event.id);
                            }}
                            className={`mt-0.5 size-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                              isCompleted
                                ? "bg-secondary border-secondary text-white"
                                : "border-border/80 bg-card hover:border-primary text-transparent"
                            }`}
                          >
                            <Check className="h-3 w-3 stroke-[3]" />
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span className="font-semibold text-foreground/80">
                                {formatTimeSlot(event.startTime)}
                              </span>
                              <Icon className="h-3 w-3 opacity-70" />
                            </div>

                            <p
                              className={`text-xs font-semibold tracking-tight truncate mt-0.5 ${
                                isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                              }`}
                            >
                              {event.title}
                            </p>

                            {event.dosage && (
                              <p className="text-[10px] text-muted-foreground truncate">
                                {event.dosage}
                              </p>
                            )}

                            {event.doctorName && (
                              <p className="text-[10px] text-accent font-medium truncate">
                                {event.doctorName}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
