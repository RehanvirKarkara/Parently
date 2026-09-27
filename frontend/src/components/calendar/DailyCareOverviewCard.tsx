import {
  AlertTriangle,
  Footprints,
  HeartPulse,
  Pill,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, todayISO } from "@/lib/utils";
import type { DayCareSummary } from "@/types/calendar";

interface DailyCareOverviewCardProps {
  summary: DayCareSummary;
  parentName: string;
}

export function DailyCareOverviewCard({ summary, parentName }: DailyCareOverviewCardProps) {
  const isToday = summary.date === todayISO();
  const title = isToday ? "Today's Care Overview" : `${formatDate(summary.date, { weekday: "short", month: "short", day: "numeric" })} Overview`;

  const statusBg =
    summary.overallStatus === "concerning"
      ? "bg-destructive/10 text-destructive border-destructive/25"
      : summary.overallStatus === "attention"
        ? "bg-warning/15 text-warning-foreground border-warning/30"
        : summary.overallStatus === "excellent"
          ? "bg-secondary/15 text-secondary border-secondary/30"
          : "bg-primary/10 text-primary border-primary/20";

  return (
    <Card className="overflow-hidden border-border/70 bg-gradient-to-r from-card/95 via-card/85 to-primary/5 shadow-soft-sm backdrop-blur-xl">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Title & Status */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Care Intelligence
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusBg}`}>
                {summary.overallStatus}
              </span>
            </div>

            <h2 className="font-heading text-lg sm:text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
              {title}
              <span className="text-xs font-normal text-muted-foreground hidden sm:inline">
                for {parentName}
              </span>
            </h2>

            <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
              <span>{summary.statusText}</span>
            </p>
          </div>

          {/* Right Signals Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Medications Signal */}
            <div className="rounded-xl border border-border/60 bg-card/80 p-2.5 flex items-center gap-2.5 shadow-soft-xs">
              <div className="size-8 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                <Pill className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Meds
                </p>
                <p className="text-xs font-bold text-foreground truncate">
                  {summary.completedMedications}/{summary.totalMedications || "0"} Taken
                </p>
              </div>
            </div>

            {/* Check-ins Signal */}
            <div className="rounded-xl border border-border/60 bg-card/80 p-2.5 flex items-center gap-2.5 shadow-soft-xs">
              <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <HeartPulse className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Check-ins
                </p>
                <p className="text-xs font-bold text-foreground truncate">
                  {summary.checkinsCompleted}/{summary.checkinsTotal} Done
                </p>
              </div>
            </div>

            {/* Activity Signal */}
            <div className="rounded-xl border border-border/60 bg-card/80 p-2.5 flex items-center gap-2.5 shadow-soft-xs">
              <div className="size-8 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Footprints className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Activity
                </p>
                <p className="text-xs font-bold text-foreground truncate">
                  {summary.activitySteps ? `${summary.activitySteps.toLocaleString()} steps` : `${summary.activityMinutes}m active`}
                </p>
              </div>
            </div>

            {/* Appointments / Alerts Signal */}
            <div className="rounded-xl border border-border/60 bg-card/80 p-2.5 flex items-center gap-2.5 shadow-soft-xs">
              <div
                className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                  summary.alertsCount > 0
                    ? "bg-destructive/15 text-destructive"
                    : summary.upcomingAppointments > 0
                      ? "bg-accent/15 text-accent"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {summary.alertsCount > 0 ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <Stethoscope className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {summary.alertsCount > 0 ? "Alerts" : "Visits"}
                </p>
                <p className="text-xs font-bold text-foreground truncate">
                  {summary.alertsCount > 0
                    ? `${summary.alertsCount} Alert`
                    : summary.upcomingAppointments > 0
                      ? `${summary.upcomingAppointments} Scheduled`
                      : "None"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
