import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  MapPin,
  Pencil,
  RotateCcw,
  Sparkles,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCalendarStore } from "@/stores/calendarStore";
import { CATEGORY_META, STATUS_META, formatTimeSlot } from "@/lib/calendarHelpers";
import { formatDate } from "@/lib/utils";

interface CareEventDetailSheetProps {
  onEditRequested?: (eventId: string) => void;
}

export function CareEventDetailSheet({ onEditRequested }: CareEventDetailSheetProps) {
  const {
    events,
    selectedEventId,
    isDetailOpen,
    setIsDetailOpen,
    setSelectedEventId,
    toggleEventCompleted,
    deleteEvent,
  } = useCalendarStore();

  const event = events.find((e) => e.id === selectedEventId);

  if (!event) {
    return (
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Event not found</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  const categoryMeta = CATEGORY_META[event.category] ?? CATEGORY_META.reminder;
  const statusMeta = STATUS_META[event.status] ?? STATUS_META.pending;
  const CategoryIcon = categoryMeta.icon;
  const isCompleted = event.status === "completed";

  const handleToggleComplete = () => {
    toggleEventCompleted(event.id);
    toast.success(
      isCompleted
        ? `Marked "${event.title}" as pending`
        : `Marked "${event.title}" as completed!`,
    );
  };

  const handleDelete = () => {
    deleteEvent(event.id);
    toast.success(`Removed "${event.title}" from calendar`);
  };

  return (
    <Sheet
      open={isDetailOpen}
      onOpenChange={(open) => {
        setIsDetailOpen(open);
        if (!open) setSelectedEventId(null);
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-md border-l border-border/70 bg-card/95 backdrop-blur-2xl p-0 flex flex-col justify-between overflow-hidden shadow-2xl"
      >
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-gradient-hero" />

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <SheetHeader className="text-left space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${categoryMeta.badgeClass}`}
              >
                <CategoryIcon className="h-3.5 w-3.5" />
                {categoryMeta.label}
              </span>

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusMeta.badgeClass}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} />
                {statusMeta.label}
              </span>
            </div>

            <SheetTitle className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug">
              {event.title}
            </SheetTitle>

            <SheetDescription className="text-sm text-muted-foreground flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
              <span>
                {formatDate(event.date, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span>·</span>
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span>
                {formatTimeSlot(event.startTime)}
                {event.endTime && ` – ${formatTimeSlot(event.endTime)}`}
              </span>
            </SheetDescription>
          </SheetHeader>

          <Separator className="bg-border/60" />

          {/* Quick Metric or Dosage Highlight */}
          {(event.dosage || event.metricValue) && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  {event.dosage ? "Prescribed Dosage" : "Health Metric"}
                </p>
                <p className="font-heading text-base font-bold text-foreground mt-0.5">
                  {event.dosage || event.metricValue}
                </p>
              </div>
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <CategoryIcon className="h-5 w-5" />
              </div>
            </div>
          )}

          {/* Clinical Doctor / Location Details */}
          {(event.doctorName || event.location) && (
            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 space-y-3">
              {event.doctorName && (
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0 mt-0.5">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Provider / Physician</p>
                    <p className="text-sm font-semibold text-foreground">{event.doctorName}</p>
                  </div>
                </div>
              )}

              {event.location && (
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Clinic / Location</p>
                    <p className="text-sm font-medium text-foreground">{event.location}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes and Context */}
          {event.details && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Details & Instructions
              </h4>
              <p className="text-sm text-foreground/90 leading-relaxed rounded-xl border border-border/60 bg-card p-3.5 shadow-soft-xs">
                {event.details}
              </p>
            </div>
          )}

          {/* Caregiver Historical Notes */}
          {event.historyNote && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-secondary" /> Caregiver Clinical Context
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed rounded-xl border border-secondary/25 bg-secondary/5 p-3.5">
                {event.historyNote}
              </p>
            </div>
          )}

          {/* Source Attribution */}
          <div className="flex items-center justify-between text-xs text-muted-foreground/80 pt-2">
            <span>
              Source: <span className="font-semibold capitalize text-foreground">{event.source}</span>
            </span>
            {event.completedAt && (
              <span className="text-secondary font-medium">
                Completed on {new Date(event.completedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <SheetFooter className="p-4 sm:p-5 border-t border-border/70 bg-card/90 backdrop-blur-xl flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant={isCompleted ? "outline" : "default"}
            size="default"
            className="flex-1 font-semibold"
            onClick={handleToggleComplete}
          >
            {isCompleted ? (
              <>
                <RotateCcw className="h-4 w-4 mr-1.5" /> Mark as Incomplete
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Mark as Completed
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            {onEditRequested && (
              <Button
                variant="outline"
                size="default"
                onClick={() => {
                  setIsDetailOpen(false);
                  onEditRequested(event.id);
                }}
              >
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
            )}

            <Button
              variant="ghost"
              size="default"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleDelete}
              aria-label="Delete entry"
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
