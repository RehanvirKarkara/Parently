import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, ClipboardCheck, Clock3, Footprints, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CHECKIN_WINDOWS } from "@/lib/constants";
import { useTodayCheckIns } from "@/hooks/useDashboardData";
import { useHealthLogs, useParent } from "@/hooks/queries";
import { useAuthStore } from "@/stores/authStore";
import { cn, formatDate, todayISO } from "@/lib/utils";
import type { TimeOfDay } from "@/types";

const periodIcons: Record<TimeOfDay, typeof Clock3> = {
  morning: Clock3,
  afternoon: Footprints,
  evening: Star,
};

export function ParentCheckInsPage() {
  const parentId = useAuthStore((s) => s.parentId) ?? "p-mom";
  const { data: parent, isLoading: loadingParent, isError: parentError, refetch: refetchParent } = useParent(parentId);
  const { status, completed, missedCount } = useTodayCheckIns(parentId);
  const { data: logs, isLoading: loadingLogs, isError: logsError, refetch: refetchLogs } = useHealthLogs(parentId);

  const today = todayISO();
  const todayLogs = (logs ?? []).filter((l) => l.log_date === today);
  const recent = (logs ?? []).filter((l) => l.log_date !== today).slice(0, 5);
  const days = Object.keys(CHECKIN_WINDOWS) as TimeOfDay[];
  const reduceMotion = useReducedMotion();

  if (loadingParent || loadingLogs) {
    return (
      <div className="mx-auto max-w-3xl space-y-4" role="status" aria-label="Loading check-ins" aria-busy="true">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-8 w-44 rounded-xl" />
          <Skeleton className="h-4 w-72 max-w-full rounded-md" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-5 shadow-soft-xs">
            <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-28 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-48 rounded-md" />
            </div>
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (parentError || logsError || !parent) {
    return (
      <ErrorState
        title="Check-ins are unavailable"
        onRetry={() => {
          void refetchParent();
          void refetchLogs();
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Daily wellness"
        title="Check-ins"
        description="Three short check-ins a day keep your family connected to how you're feeling."
        actions={
          <Badge variant={missedCount === 0 ? "success" : "warning"} className="px-3 py-1.5">
            {completed}/3 done today
          </Badge>
        }
      />

      <div className="space-y-4">
        {days.map((period, i) => {
          const done = status[period];
          const meta = CHECKIN_WINDOWS[period];
          const Icon = periodIcons[period];
          const log = todayLogs.find((l) => l.log_time_of_day === period);
          return (
            <motion.div key={period} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
               <Link to={`/parent/check-in/${period}`} className="block rounded-[1.25rem] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15">
                 <Card className={cn("transition-[border-color,background-color,box-shadow] hover:border-primary/20 hover:shadow-soft", done && "border-secondary/20 bg-secondary/5")}>
                  <CardContent className="flex items-center gap-4 p-5">
                     <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", done ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary")}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                         <p className="font-heading text-base font-semibold text-foreground">{meta.label}</p>
                        <Badge variant={done ? "success" : "muted"}>{done ? "Completed" : "Pending"}</Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{meta.time} · {meta.description}</p>
                      {done && log && <p className="mt-1 text-xs font-medium text-secondary">Logged at {formatDate(log.updated_at, { hour: "numeric", minute: "2-digit" })}</p>}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <div className="flex items-center gap-3">
                        {log?.meds_taken != null && (
                          <span className="text-xs font-semibold text-muted-foreground">
                            Meds {log.meds_taken ? <span className="text-secondary">✓</span> : <span className="text-destructive">✗</span>}
                          </span>
                        )}
                        {log?.day_rating != null && <span className="font-metric text-xs font-bold text-warning-foreground">{log.day_rating}/10</span>}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

       <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
         <h2 className="font-heading text-lg font-semibold text-foreground">Recent activity</h2>
         <Button variant="ghost" size="sm" onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })}>
          <ClipboardCheck /> View my health
        </Button>
      </div>
      <div className="mt-3 space-y-2">
        {recent.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">No check-ins yet — your daily logs will appear here.</CardContent>
          </Card>
        ) : (
          recent.map((log) => (
               <Card key={log.id} className="rounded-xl transition-[border-color,box-shadow] hover:border-primary/20 hover:shadow-soft">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", log.log_time_of_day === "morning" ? "bg-warning/12 text-warning-foreground" : log.log_time_of_day === "afternoon" ? "bg-accent/15 text-accent-foreground" : "bg-primary/10 text-primary")}>
                  {log.log_time_of_day === "morning" ? <Clock3 className="h-4 w-4" /> : log.log_time_of_day === "afternoon" ? <Footprints className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {CHECKIN_WINDOWS[log.log_time_of_day].label} · {formatDate(log.log_date)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {log.hours_slept != null && `${log.hours_slept}h sleep · `}
                    {log.steps_walked_afternoon != null && `${log.steps_walked_afternoon} steps · `}
                    {log.day_rating != null ? `rated ${log.day_rating}/10` : "check-in complete"}
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 shrink-0 text-secondary" />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
