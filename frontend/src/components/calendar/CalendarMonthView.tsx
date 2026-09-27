import { useCalendarStore } from "@/stores/calendarStore";
import { CATEGORY_META } from "@/lib/calendarHelpers";
import { toISODate, todayISO } from "@/lib/utils";
import type { CareCalendarEvent } from "@/types/calendar";

interface CalendarMonthViewProps {
  currentDate: string; // YYYY-MM-DD
  events: CareCalendarEvent[];
  onSelectDate: (date: string) => void;
  onAddEvent?: () => void;
}

interface CalendarCell {
  date: Date;
  iso: string;
  isCurrentMonth: boolean;
}

function getMonthMatrix(dateStr: string): CalendarCell[] {
  const d = new Date(dateStr + "T12:00:00Z");
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();

  const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));

  // Monday = 0, Sunday = 6
  let firstDayIndex = firstDayOfMonth.getUTCDay() - 1;
  if (firstDayIndex === -1) firstDayIndex = 6;

  const cells: CalendarCell[] = [];

  // Previous month filler days
  for (let i = firstDayIndex; i > 0; i--) {
    const prevDate = new Date(Date.UTC(year, month, 1 - i));
    cells.push({
      date: prevDate,
      iso: toISODate(prevDate),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= lastDayOfMonth.getUTCDate(); i++) {
    const curDate = new Date(Date.UTC(year, month, i));
    cells.push({
      date: curDate,
      iso: toISODate(curDate),
      isCurrentMonth: true,
    });
  }

  // Next month filler days to complete weeks (up to 35 or 42 cells)
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const nextDate = new Date(Date.UTC(year, month + 1, i));
    cells.push({
      date: nextDate,
      iso: toISODate(nextDate),
      isCurrentMonth: false,
    });
  }

  return cells;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarMonthView({
  currentDate,
  events,
  onSelectDate,
}: CalendarMonthViewProps) {
  const { setSelectedEventId, setViewMode } = useCalendarStore();
  const cells = getMonthMatrix(currentDate);
  const today = todayISO();

  return (
    <div className="rounded-2xl border border-border/70 bg-card/85 p-3 sm:p-5 shadow-soft-sm backdrop-blur-xl space-y-2">
      {/* Weekday Labels Header */}
      <div className="grid grid-cols-7 gap-1 text-center pb-2 border-b border-border/60">
        {WEEKDAYS.map((wd) => (
          <span
            key={wd}
            className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            {wd}
          </span>
        ))}
      </div>

      {/* Month Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((cell) => {
          const isSelected = cell.iso === currentDate;
          const isToday = cell.iso === today;
          const dayNumber = cell.date.getUTCDate();

          const dayEvents = events
            .filter((e) => e.date === cell.iso)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          const meds = dayEvents.filter((e) => e.category === "medication");
          const completedMeds = meds.filter((e) => e.status === "completed").length;
          const hasAlert = dayEvents.some((e) => e.status === "alert" || e.category === "health_event");

          return (
            <div
              key={cell.iso}
              onClick={() => onSelectDate(cell.iso)}
              onDoubleClick={() => {
                onSelectDate(cell.iso);
                setViewMode("day");
              }}
              className={`min-h-[90px] sm:min-h-[120px] rounded-xl border p-1.5 sm:p-2 flex flex-col justify-between transition-all duration-200 cursor-pointer text-left select-none ${
                isSelected
                  ? "border-primary bg-primary/8 shadow-soft ring-2 ring-primary/20"
                  : cell.isCurrentMonth
                    ? "border-border/60 bg-card/70 hover:border-border/90 hover:bg-card"
                    : "border-border/30 bg-muted/20 opacity-45 hover:opacity-75"
              }`}
            >
              {/* Day Header Row */}
              <div className="flex items-center justify-between">
                <span
                  className={`size-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isToday
                      ? "bg-primary text-primary-foreground shadow-brand-xs"
                      : isSelected
                        ? "text-primary font-extrabold"
                        : "text-foreground"
                  }`}
                >
                  {dayNumber}
                </span>

                <div className="flex items-center gap-1.5">
                  {hasAlert && (
                    <span
                      className="size-2 rounded-full bg-destructive animate-pulse"
                      title="Care alert or health event"
                    />
                  )}
                  {meds.length > 0 && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        completedMeds === meds.length
                          ? "bg-secondary/15 text-secondary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {completedMeds}/{meds.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Event Pills (up to 3) */}
              <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                {dayEvents.slice(0, 3).map((event) => {
                  const cat = CATEGORY_META[event.category] ?? CATEGORY_META.reminder;
                  const isCompleted = event.status === "completed";

                  return (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEventId(event.id);
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] truncate font-medium flex items-center gap-1 border transition-colors ${
                        isCompleted
                          ? "bg-muted/40 text-muted-foreground border-border/40 line-through"
                          : `${cat.badgeClass}`
                      }`}
                    >
                      <span className={`size-1.5 rounded-full shrink-0 ${cat.dotClass}`} />
                      <span className="truncate">{event.title}</span>
                    </div>
                  );
                })}

                {dayEvents.length > 3 && (
                  <p className="text-[10px] font-bold text-primary px-1">
                    +{dayEvents.length - 3} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
