import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronDown, Footprints, Moon, Pill, Star, Sun, Sunrise } from "lucide-react";
import { useMemo, useState } from "react";
import { HealthChart } from "@/components/charts/HealthChart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardSlider } from "@/components/shared/CardSlider";
import { LogsSkeleton } from "@/components/shared/RichSkeletons";
import { useParents } from "@/hooks/queries";
import { useRatingSeries, useSleepSeries } from "@/hooks/useDashboardData";
import { useHealthLogs } from "@/hooks/queries";
import { cn, formatDate } from "@/lib/utils";
import type { HealthLog, TimeOfDay } from "@/types";
import { ParentSelector } from "@/components/shared/ParentSelector";

type Range = 7 | 14 | 30;

const ranges: Range[] = [7, 14, 30];

export function HealthLogsPage() {
  const { data: parents } = useParents();
  const [parentId, setParentId] = useState("p-mom");
  const [range, setRange] = useState<Range>(7);

  return (
    <div>
      <PageHeader
        eyebrow="Tracking"
        title="Health Logs"
        description="Every check-in, in one clear timeline. Filter by parent and date range."
        actions={
          <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-card/90 p-1 shadow-soft-xs" role="group" aria-label="Date range">
            {ranges.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={range === r}
                onClick={() => setRange(r)}
                className={cn(
                   "min-h-9 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
                   range === r ? "bg-primary/8 text-primary ring-1 ring-primary/10" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {r} days
              </button>
            ))}
          </div>
        }
      />

       <div className="mb-6">
         <ParentSelector parents={parents} activeId={parentId} onChange={setParentId} />
       </div>

       <HealthLogsContent parentId={parentId} range={range} />
    </div>
  );
}

function HealthLogsContent({ parentId, range }: { parentId: string; range: Range }) {
  const { data: logs, isLoading, isError, refetch } = useHealthLogs(parentId);
  const sleepSeries = useSleepSeries(parentId);
  const ratingSeries = useRatingSeries(parentId);

  const cutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - (range - 1));
    return d.toISOString().slice(0, 10);
  }, [range]);

  const days = useMemo(() => {
    const map = new Map<string, HealthLog[]>();
    for (const log of logs ?? []) {
      if (log.log_date < cutoff) continue;
      const arr = map.get(log.log_date) ?? [];
      arr.push(log);
      map.set(log.log_date, arr);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [logs, cutoff]);

  const summary = useMemo(() => {
    const sleeps = (logs ?? []).filter((l) => l.hours_slept != null && l.log_date >= cutoff).map((l) => l.hours_slept as number);
    const steps = (logs ?? []).filter((l) => l.log_date >= cutoff).reduce((s, l) => s + (l.steps_walked_afternoon ?? 0) + (l.steps_walked_evening ?? 0), 0);
    const ratings = (logs ?? []).filter((l) => l.day_rating != null && l.log_date >= cutoff).map((l) => l.day_rating as number);
    const meds = (logs ?? []).filter((l) => l.meds_taken != null && l.log_date >= cutoff);
    const adherence = meds.length ? Math.round((meds.filter((l) => l.meds_taken).length / meds.length) * 100) : 0;
    const dayCount = days.length || 1;
    return {
      avgSleep: sleeps.length ? (sleeps.reduce((a, b) => a + b, 0) / sleeps.length).toFixed(1) : "—",
      avgSteps: Math.round(steps / dayCount).toLocaleString(),
      adherence: meds.length ? `${adherence}%` : "—",
      avgRating: ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "—",
    };
  }, [logs, cutoff, days.length]);

  if (isLoading) return <LogsSkeleton />;
  if (isError) return <ErrorState title="Health logs are unavailable" onRetry={() => void refetch()} />;

  return (
    <div className="space-y-6">
      {/* Desktop & Tablet Grid */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryTile icon={Moon} label="Avg sleep" value={`${summary.avgSleep}h`} color="brand" />
        <SummaryTile icon={Footprints} label="Avg steps/day" value={summary.avgSteps} color="coral" />
        <SummaryTile icon={Pill} label="Adherence" value={summary.adherence} color="mint" />
        <SummaryTile icon={Star} label="Avg day rating" value={`${summary.avgRating}/10`} color="warning" />
      </div>
      {/* Mobile Touch-Swipe Slider */}
      <div className="sm:hidden">
        <CardSlider itemClassName="w-[68vw]" showDots gap="sm" ariaLabel="Health logs averages">
          {[
            <SummaryTile key="s1" icon={Moon} label="Avg sleep" value={`${summary.avgSleep}h`} color="brand" />,
            <SummaryTile key="s2" icon={Footprints} label="Avg steps/day" value={summary.avgSteps} color="coral" />,
            <SummaryTile key="s3" icon={Pill} label="Adherence" value={summary.adherence} color="mint" />,
            <SummaryTile key="s4" icon={Star} label="Avg day rating" value={`${summary.avgRating}/10`} color="warning" />,
          ]}
        </CardSlider>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60 shadow-soft">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Sleep</CardTitle></CardHeader>
          <CardContent><HealthChart series={sleepSeries} unit="h" color="hsl(var(--primary))" height={190} /></CardContent>
        </Card>
        <Card className="border-border/60 shadow-soft">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Day rating</CardTitle></CardHeader>
          <CardContent><HealthChart series={ratingSeries} unit="/10" color="hsl(var(--accent))" height={190} yDomain={[1, 10]} /></CardContent>
        </Card>
      </div>

      <div>
        <h3 className="mb-4 font-heading text-lg font-semibold text-foreground">Daily timeline</h3>
        {days.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No check-ins in this range"
            description="Health and wellness check-ins your parents submit will appear here."
          />
        ) : (
          <div className="space-y-3">
            {days.map(([date, dayLogs], i) => (
              <DayCard key={date} date={date} logs={dayLogs} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DayCard({ date, logs, index }: { date: string; logs: HealthLog[]; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const completed = logs.filter((l) => l.log_time_of_day === "morning" ? l.hours_slept != null : l.log_time_of_day === "afternoon" ? l.lunch_details != null : l.snacks_dinner_details != null).length;
  const rating = logs.find((l) => l.day_rating != null)?.day_rating;

  const periodLog = (p: TimeOfDay) => logs.find((l) => l.log_time_of_day === p);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="overflow-hidden rounded-xl border border-border/70 bg-card/90 shadow-soft-xs transition-[border-color,box-shadow] hover:border-primary/20 hover:shadow-soft"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`daycard-${date}-panel`}
        aria-label={`${open ? "Collapse" : "Expand"} check-ins for ${formatDate(date, { weekday: "long" })}`}
        className="flex w-full items-center gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-primary/15 sm:gap-4 sm:p-5"
      >
        <div className="w-32 shrink-0">
          <p className="text-sm font-semibold text-foreground">{formatDate(date, { weekday: "short" })}</p>
          <p className="text-xs text-muted-foreground">{formatDate(date)}</p>
        </div>
        <div className="flex flex-1 items-center justify-center gap-2">
          {(["morning", "afternoon", "evening"] as TimeOfDay[]).map((p) => {
            const log = periodLog(p);
            const done = log ? (p === "morning" ? log.hours_slept != null : p === "afternoon" ? log.lunch_details != null : log.snacks_dinner_details != null) : false;
            return <PeriodDot key={p} period={p} done={done} />;
          })}
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          {rating && <Badge variant="warning"><Star className="h-3 w-3" /> {rating}</Badge>}
          <span className="text-xs font-bold text-muted-foreground">{completed}/3</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div id={`daycard-${date}-panel`} className="grid gap-4 border-t border-border/60 bg-muted/20 p-4 sm:grid-cols-3 sm:p-5">
              <PeriodDetail log={periodLog("morning")} period="morning" />
              <PeriodDetail log={periodLog("afternoon")} period="afternoon" />
              <PeriodDetail log={periodLog("evening")} period="evening" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PeriodDot({ period, done }: { period: TimeOfDay; done: boolean }) {
  const config = {
    morning: { icon: Sunrise, color: "bg-warning/10 text-warning-foreground", doneColor: "bg-secondary text-secondary-foreground shadow-mint" },
    afternoon: { icon: Sun, color: "bg-accent/12 text-accent", doneColor: "bg-secondary text-secondary-foreground shadow-mint" },
    evening: { icon: Moon, color: "bg-primary/10 text-primary", doneColor: "bg-secondary text-secondary-foreground shadow-mint" },
  }[period];
  const Icon = config.icon;
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-colors", done ? config.doneColor : config.color)}>
        <Icon className="h-4 w-4" />
        <span className="sr-only">{done ? "Completed" : "Not completed"}</span>
      </span>
      <span className="text-[0.6875rem] font-medium capitalize text-muted-foreground">{period}</span>
    </div>
  );
}

function PeriodDetail({ log, period }: { log: HealthLog | undefined; period: TimeOfDay }) {
  const title = period.charAt(0).toUpperCase() + period.slice(1);
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-[0.07em] text-muted-foreground">{title}</p>
      {!log ? (
        <p className="text-xs italic text-muted-foreground">Not completed</p>
      ) : period === "morning" ? (
        <div className="space-y-2 text-sm">
          <DetailRow label="Sleep" value={log.hours_slept ? `${log.hours_slept}h` : "—"} mono />
          <DetailRow label="Medicines" value={log.meds_taken == null ? "—" : log.meds_taken ? "Taken" : "Missed"} positive={log.meds_taken} />
          <DetailRow label="Breakfast" value={log.breakfast_details ?? "—"} />
        </div>
      ) : period === "afternoon" ? (
        <div className="space-y-2 text-sm">
          <DetailRow label="Lunch" value={log.lunch_details ?? "—"} />
          <DetailRow label="Steps" value={log.steps_walked_afternoon != null ? log.steps_walked_afternoon.toLocaleString() : "—"} mono />
          <DetailRow label="Workout" value={log.workout_details ?? "—"} />
        </div>
      ) : (
        <div className="space-y-2 text-sm">
          <DetailRow label="Dinner" value={log.snacks_dinner_details ?? "—"} />
          <DetailRow label="Steps" value={log.steps_walked_evening != null ? log.steps_walked_evening.toLocaleString() : "—"} mono />
          <DetailRow label="Day rating" value={log.day_rating != null ? `${log.day_rating}/10` : "—"} mono />
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, mono, positive }: { label: string; value: string; mono?: boolean; positive?: boolean | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-medium", mono && "font-metric font-semibold", positive === false && "text-destructive", positive === true && "text-secondary")}>
        {value}
      </p>
    </div>
  );
}

function SummaryTile({ icon: Icon, label, value, color }: { icon: typeof Moon; label: string; value: string; color: "brand" | "mint" | "coral" | "warning" }) {
  const colors = {
    brand: "bg-primary/10 text-primary ring-1 ring-primary/20",
    mint: "bg-secondary/10 text-secondary ring-1 ring-secondary/20",
    coral: "bg-accent/12 text-accent ring-1 ring-accent/20",
    warning: "bg-warning/10 text-warning-foreground ring-1 ring-warning/20",
  };
  return (
    <div className="card-elevated p-5">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", colors[color])}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 font-metric text-2xl font-semibold tracking-[-0.03em] text-foreground">{value}</p>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}
