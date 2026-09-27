import { motion, type Variants } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  BellRing,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Footprints,
  Heart,
  Moon,
  Phone,
  Pill,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { HealthChart } from "@/components/charts/HealthChart";
import { MiniRing, ScoreRing } from "@/components/charts/ScoreRing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { ParentSelector } from "@/components/shared/ParentSelector";
import { CardSlider } from "@/components/shared/CardSlider";
import { DashboardSkeleton } from "@/components/shared/RichSkeletons";
import { Button } from "@/components/ui/button";
import { cn, relativeTime } from "@/lib/utils";
import { useDashboardStats, useRatingSeries, useSleepSeries, useStepsSeries } from "@/hooks/useDashboardData";
import { useMedicines, useParents, useHealthLogs, useNotifications, useReports } from "@/hooks/queries";
import { todayISO } from "@/lib/utils";
import type { Medicine, TimeOfDay, HealthLog, AppNotification, Report } from "@/types";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.02,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export function DashboardPage() {
  const { data: parents, isLoading: loadingParents, isError: parentsError, refetch: refetchParents } = useParents();
  const [activeParentId, setActiveParentId] = useState<string>("p-mom");
  const navigate = useNavigate();

  if (loadingParents) {
    return <DashboardSkeleton />;
  }

  if (parentsError) {
    return <ErrorState title="The care dashboard is unavailable" onRetry={() => void refetchParents()} />;
  }

  if (!parents?.length) {
    return (
      <EmptyState
        icon={Heart}
        title="Welcome to Parently"
        description="Add your first parent to start tracking daily check-ins, medicines, and well-being — all in one calm place."
        actionLabel="Set up your parent"
        onAction={() => navigate("/onboarding")}
      />
    );
  }

  const activeParent = parents?.find((p) => p.id === activeParentId) ?? parents?.[0];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header with Live Status Badge */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <motion.div variants={item} className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.09em] text-primary ring-1 ring-inset ring-primary/10">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            Live Care Dashboard
          </motion.div>
          <motion.h1 variants={item} className="font-heading text-[1.75rem] font-semibold leading-tight text-foreground sm:text-[2.125rem]">
            Today at a glance
          </motion.h1>
          <motion.p variants={item} className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Real-time status, health vitals, and family connection for {activeParent?.first_name}.
          </motion.p>
        </div>

        <motion.div variants={item} className="min-w-0">
          <ParentSelector parents={parents} activeId={activeParentId} onChange={setActiveParentId} />
        </motion.div>
      </div>

      {activeParent && (
        <DashboardContent parent={activeParent} key={activeParent.id} />
      )}
    </motion.div>
  );
}

function DashboardContent({ parent }: { parent: { id: string; first_name: string; last_name: string; avatar_color?: string; avatar_url?: string | null; phone?: string | null } }) {
  const parentId = parent.id;
  const parentFirstName = parent.first_name;
  const stats = useDashboardStats(parentId);
  const sleepSeries = useSleepSeries(parentId);
  const stepsSeries = useStepsSeries(parentId);
  const ratingSeries = useRatingSeries(parentId);
  const { data: medicines } = useMedicines(parentId);
  const { data: logs } = useHealthLogs(parentId);
  const { data: notifications } = useNotifications();
  const { data: reports } = useReports();
  const navigate = useNavigate();

  const today = todayISO();
  const todayLogs = logs?.filter((l) => l.log_date === today) ?? [];
  const missedToday = 3 - todayLogs.length;
  const ratingToday = todayLogs.find((l) => l.day_rating != null)?.day_rating;
  const morningLog = todayLogs.find((l) => l.log_time_of_day === "morning");
  const afternoonLog = todayLogs.find((l) => l.log_time_of_day === "afternoon");
  const eveningLog = todayLogs.find((l) => l.log_time_of_day === "evening");

  const upcoming = medicines?.slice(0, 3) ?? [];

  const completedToday = todayLogs.filter(
    (l) =>
      l.log_time_of_day === "morning"
        ? l.hours_slept != null
        : l.log_time_of_day === "afternoon"
          ? l.lunch_details != null
          : l.snacks_dinner_details != null,
  ).length;

  const [calling, setCalling] = useState(false);
  const [reminding, setReminding] = useState(false);

  const handleCall = async () => {
    setCalling(true);
    await new Promise((r) => setTimeout(r, 600));
    setCalling(false);
    toast.success(`Connecting call to ${parentFirstName}'s phone…`);
  };

  const handleReminder = async () => {
    setReminding(true);
    await new Promise((r) => setTimeout(r, 600));
    setReminding(false);
    toast.success(`Gentle reminder sent to ${parentFirstName}'s device`);
  };

  return (
    <>
      {/* 1. Hero Well-being Status Banner with Quick Call / Message Actions */}
      <motion.div variants={item}>
        <Card className="relative overflow-hidden border-border/70 bg-card/95 shadow-soft-md">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
          <CardContent className="relative p-5 sm:p-6 lg:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              {/* Parent Info & Live Status */}
              <div className="flex items-start gap-4">
                <PersonAvatar
                  first={parentFirstName}
                  last={parent.last_name}
                  src={parent.avatar_url}
                  color={parent.avatar_color}
                  size="xl"
                  className="shrink-0 ring-4 ring-primary/10"
                />
                <div>
                   <div className="flex flex-wrap items-center gap-2">
                     <h2 className="font-heading text-xl font-semibold tracking-[-0.025em] text-foreground sm:text-2xl">{parentFirstName} {parent.last_name}</h2>
                     <Badge
                       variant={missedToday === 0 ? "success" : missedToday === 3 ? "destructive" : "warning"}
                        className="px-2.5 py-1"
                     >
                        <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current" />
                       {missedToday === 0
                         ? "All Clear · 3/3 Logs"
                         : `${completedToday} of 3 Check-ins Done`}
                     </Badge>
                     {/* Daily progress indicator */}
                      <div className="flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1.5 ring-1 ring-inset ring-border/50">
                       <span className="text-xs font-semibold text-muted-foreground">Today:</span>
                       <div className="flex items-center gap-1">
                         {(() => {
                           const pct = Math.round((completedToday / 3) * 100);
                           const color =
                              completedToday === 3 ? "hsl(var(--secondary))" : completedToday >= 1 ? "hsl(var(--warning))" : "hsl(var(--accent))";
                           return <MiniRing value={pct} size={24} strokeWidth={3} color={color} />;
                         })()}
                         <span className="text-xs font-semibold text-foreground">{completedToday}/3</span>
                       </div>
                     </div>
                   </div>

                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {missedToday === 0
                      ? `Everything is logged and steady for today. Last update received recently.`
                      : `${parentFirstName} has logged ${3 - missedToday} check-in${3 - missedToday === 1 ? "" : "s"} today.`}
                  </p>

                  {/* Quick Action Chips */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl shadow-soft-xs"
                      isLoading={calling}
                      loadingText="Calling…"
                      onClick={() => void handleCall()}
                    >
                      <Phone className="h-3.5 w-3.5 text-secondary" /> Call {parentFirstName}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl shadow-soft-xs"
                      isLoading={reminding}
                      loadingText="Sending…"
                      onClick={() => void handleReminder()}
                    >
                      <BellRing className="h-3.5 w-3.5 text-primary" /> Send Reminder
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl text-primary font-bold"
                      onClick={() => navigate("/parent")}
                    >
                      Switch to {parentFirstName}'s view <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Health Score Circle Badge */}
              <div className="flex shrink-0 items-center justify-between gap-6 border-t border-border/50 pt-4 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
                <div className="text-center lg:text-right">
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Daily Health Score</p>
                  <p className="font-metric mt-1 text-4xl font-semibold tracking-[-0.04em] text-primary">{stats.dailyHealthScore}</p>
                  <p className="text-xs font-semibold text-muted-foreground flex items-center justify-center lg:justify-end gap-1 mt-1">
                    <TrendingUp className={cn("h-3.5 w-3.5 text-secondary", stats.scoreDelta < 0 && "rotate-180 text-destructive")} />
                    {Math.abs(stats.scoreDelta)}% vs last week
                  </p>
                </div>
                <ScoreRing
                  value={stats.dailyHealthScore}
                  size={96}
                  strokeWidth={9}
                  color="hsl(var(--primary))"
                  trackColor="hsl(var(--primary) / 0.12)"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 2. Today's Check-in Schedule & Timeline Tracker */}
      <motion.div variants={item}>
        <Card className="border-border/60 shadow-soft">
          <CardHeader className="flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <CalendarCheck className="h-5 w-5 text-primary" /> Today's Check-in Timeline
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Live updates logged throughout the day</p>
            </div>
            <div className="flex items-center gap-2.5">
              <Link to="/calendar" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                Care Calendar <ChevronRight className="h-3.5 w-3.5" />
              </Link>
              <span className="text-muted-foreground/40">·</span>
              <Link to="/health-logs" className="text-xs font-semibold text-muted-foreground hover:text-primary hover:underline flex items-center gap-1">
                Health logs <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>

          <CardContent>
            {/* Desktop 3-column Grid */}
            <div className="hidden xl:grid gap-4 xl:grid-cols-3">
              <CheckInTimelineCard
                period="morning"
                timeLabel="08:00 AM"
                title="Morning Check-in"
                icon={Sunrise}
                log={morningLog}
                accentColor="warning"
                details={
                  morningLog
                    ? [
                        `😴 Slept ${morningLog.hours_slept ?? "—"} hrs`,
                        `💊 Meds: ${morningLog.meds_taken ? "Taken" : "Missed"}`,
                        `🥣 Meal: ${morningLog.breakfast_details || "Logged"}`,
                      ]
                    : undefined
                }
              />
              <CheckInTimelineCard
                period="afternoon"
                timeLabel="01:00 PM"
                title="Afternoon Check-in"
                icon={Sun}
                log={afternoonLog}
                accentColor="coral"
                details={
                  afternoonLog
                    ? [
                        `🥗 Lunch: ${afternoonLog.lunch_details || "Logged"}`,
                        `🚶 Steps: ${(afternoonLog.steps_walked_afternoon ?? 0).toLocaleString()}`,
                        `🏃 Activity: ${afternoonLog.workout_details || "Light Walk"}`,
                      ]
                    : undefined
                }
              />
              <CheckInTimelineCard
                period="evening"
                timeLabel="08:00 PM"
                title="Evening Check-in"
                icon={Moon}
                log={eveningLog}
                accentColor="brand"
                details={
                  eveningLog
                    ? [
                        `🍲 Dinner: ${eveningLog.snacks_dinner_details || "Logged"}`,
                        `🚶 Steps: ${(eveningLog.steps_walked_evening ?? 0).toLocaleString()}`,
                        `⭐️ Mood rating: ${eveningLog.day_rating ?? "—"}/10`,
                      ]
                    : undefined
                }
              />
            </div>

            {/* Mobile / Tablet Horizontal Slider */}
            <div className="xl:hidden">
              <CardSlider itemClassName="w-[84vw] sm:w-[340px]" showDots gap="md" ariaLabel="Today's check-ins">
                {[
                  <CheckInTimelineCard
                    key="m"
                    period="morning"
                    timeLabel="08:00 AM"
                    title="Morning Check-in"
                    icon={Sunrise}
                    log={morningLog}
                    accentColor="warning"
                    details={
                      morningLog
                        ? [
                            `😴 Slept ${morningLog.hours_slept ?? "—"} hrs`,
                            `💊 Meds: ${morningLog.meds_taken ? "Taken" : "Missed"}`,
                            `🥣 Meal: ${morningLog.breakfast_details || "Logged"}`,
                          ]
                        : undefined
                    }
                  />,
                  <CheckInTimelineCard
                    key="a"
                    period="afternoon"
                    timeLabel="01:00 PM"
                    title="Afternoon Check-in"
                    icon={Sun}
                    log={afternoonLog}
                    accentColor="coral"
                    details={
                      afternoonLog
                        ? [
                            `🥗 Lunch: ${afternoonLog.lunch_details || "Logged"}`,
                            `🚶 Steps: ${(afternoonLog.steps_walked_afternoon ?? 0).toLocaleString()}`,
                            `🏃 Activity: ${afternoonLog.workout_details || "Light Walk"}`,
                          ]
                        : undefined
                    }
                  />,
                  <CheckInTimelineCard
                    key="e"
                    period="evening"
                    timeLabel="08:00 PM"
                    title="Evening Check-in"
                    icon={Moon}
                    log={eveningLog}
                    accentColor="brand"
                    details={
                      eveningLog
                        ? [
                            `🍲 Dinner: ${eveningLog.snacks_dinner_details || "Logged"}`,
                            `🚶 Steps: ${(eveningLog.steps_walked_evening ?? 0).toLocaleString()}`,
                            `⭐️ Mood rating: ${eveningLog.day_rating ?? "—"}/10`,
                          ]
                        : undefined
                    }
                  />,
                ]}
              </CardSlider>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 3. Stat Cards Row (Desktop Grid + Mobile Touch-Swipe Slider) */}
      <motion.div variants={item}>
        <div className="hidden sm:grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={Pill} label="Medicine Adherence" value={`${stats.adherenceRate}%`} sublabel="7-day average" delta={stats.adherenceDelta} iconColor="mint" index={0} />
          <StatCard icon={Moon} label="Avg Sleep" value={`${stats.avgSleep}h`} sublabel="last 7 nights" delta={stats.sleepDelta} iconColor="brand" index={1} />
          <StatCard icon={Footprints} label="Active Days" value={`${stats.activeDays}/7`} sublabel="logged activity" delta={stats.activeDaysDelta} iconColor="coral" index={2} />
          <StatCard icon={Star} label="Day Rating" value={ratingToday ? `${ratingToday}/10` : "—"} sublabel={ratingToday ? "today" : "awaiting log"} iconColor="warning" index={3} />
        </div>
        <div className="sm:hidden">
          <CardSlider itemClassName="w-[74vw]" showDots gap="sm" ariaLabel="Health metrics summary">
            {[
              <StatCard key="s0" icon={Pill} label="Medicine Adherence" value={`${stats.adherenceRate}%`} sublabel="7-day average" delta={stats.adherenceDelta} iconColor="mint" index={0} />,
              <StatCard key="s1" icon={Moon} label="Avg Sleep" value={`${stats.avgSleep}h`} sublabel="last 7 nights" delta={stats.sleepDelta} iconColor="brand" index={1} />,
              <StatCard key="s2" icon={Footprints} label="Active Days" value={`${stats.activeDays}/7`} sublabel="logged activity" delta={stats.activeDaysDelta} iconColor="coral" index={2} />,
              <StatCard key="s3" icon={Star} label="Day Rating" value={ratingToday ? `${ratingToday}/10` : "—"} sublabel={ratingToday ? "today" : "awaiting log"} iconColor="warning" index={3} />,
            ]}
          </CardSlider>
        </div>
      </motion.div>

      {/* 4. Vitals Trends & Charts Grid */}
      <motion.div variants={item} className="grid gap-6 xl:grid-cols-3">
        <ChartCard title="Sleep Duration" subtitle="Hours per night (Target: 7-8h)" series={sleepSeries} unit="h" color="hsl(var(--primary))" />
        <ChartCard title="Daily Physical Activity" subtitle="Steps count per day" series={stepsSeries} unit="steps" color="hsl(var(--secondary))" />
        <ChartCard title="Evening Well-being Rating" subtitle="Self-reported mood scale 1–10" series={ratingSeries} unit="/10" color="hsl(var(--accent))" yDomain={[1, 10]} />
      </motion.div>

      {/* 5. Reminders · Medicines · AI Insights (Desktop Grid + Mobile/Tablet Slider) */}
      <motion.div variants={item}>
        <div className="hidden xl:grid gap-6 xl:grid-cols-3">
          <TodaysRemindersCard medicines={upcoming} parentId={parentId} completedToday={completedToday} />
          <UpcomingMedsCard medicines={upcoming} parentId={parentId} />
          <RecommendationsCard stats={stats} ratingSeries={ratingSeries} parentFirstName={parentFirstName} />
        </div>
        <div className="xl:hidden">
          <CardSlider itemClassName="w-[88vw] sm:w-[380px]" showDots gap="md" ariaLabel="Reminders and AI Insights">
            {[
              <TodaysRemindersCard key="w1" medicines={upcoming} parentId={parentId} completedToday={completedToday} />,
              <UpcomingMedsCard key="w2" medicines={upcoming} parentId={parentId} />,
              <RecommendationsCard key="w3" stats={stats} ratingSeries={ratingSeries} parentFirstName={parentFirstName} />,
            ]}
          </CardSlider>
        </div>
      </motion.div>

      {/* 6. Recent Activity Timeline */}
      <motion.div variants={item}>
        <RecentActivityTimeline logs={logs ?? []} medicines={medicines ?? []} notifications={notifications ?? []} reports={reports ?? []} parentFirstName={parentFirstName} />
      </motion.div>
    </>
  );
}

function CheckInTimelineCard({
  timeLabel,
  title,
  icon: Icon,
  log,
  accentColor,
  details,
}: {
  period: TimeOfDay;
  timeLabel: string;
  title: string;
  icon: LucideIcon;
  log?: any;
  accentColor: "warning" | "coral" | "brand";
  details?: string[];
}) {
  const isDone = Boolean(log);
  const colorClasses = {
    warning: "bg-warning/10 text-warning-foreground ring-1 ring-warning/20",
    coral: "bg-accent/12 text-accent ring-1 ring-accent/20",
    brand: "bg-primary/10 text-primary ring-1 ring-primary/20",
  }[accentColor];

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between rounded-xl border p-4 transition-[border-color,box-shadow] duration-200",
        isDone
          ? "border-secondary/20 bg-secondary/5 shadow-soft-xs"
          : "border-border/70 bg-card/80 hover:border-primary/25 hover:shadow-soft-xs",
      )}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl font-bold", colorClasses)}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">{title}</p>
              <p className="mt-0.5 text-[0.6875rem] font-medium text-muted-foreground">{timeLabel}</p>
            </div>
          </div>
          <Badge variant={isDone ? "success" : "outline"}>
            {isDone ? <CheckCircle2 className="h-3 w-3 mr-1" /> : null}
            {isDone ? "Completed" : "Pending"}
          </Badge>
        </div>

        {isDone && details ? (
          <div className="space-y-1.5 my-2 rounded-xl bg-background/60 p-2.5 text-xs">
            {details.map((d, i) => (
              <p key={i} className="font-semibold text-foreground/90 leading-relaxed">{d}</p>
            ))}
          </div>
        ) : (
          <p className="my-3 text-xs text-muted-foreground leading-relaxed">
            Check-in window open. Remind or complete on behalf of parent.
          </p>
        )}
      </div>

      <Link
        to="/health-logs"
        className={cn(
          "mt-2 inline-flex min-h-9 items-center justify-between rounded-lg text-xs font-semibold hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
          isDone ? "text-secondary" : "text-primary",
        )}
      >
        <span>{isDone ? "View details" : "Log check-in"}</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function ChartCard({ title, subtitle, series, unit, color, yDomain }: { title: string; subtitle: string; series: ReturnType<typeof useSleepSeries>; unit: string; color: string; yDomain?: [number, number] }) {
  return (
    <Card className="h-full border-border/60 shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent>
        {series.data.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-center">
            <div>
              <BarChart3 className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">No data recorded yet</p>
            </div>
          </div>
        ) : (
          <HealthChart series={series} unit={unit} color={color} height={195} yDomain={yDomain} />
        )}
      </CardContent>
    </Card>
  );
}

interface AiRec {
  icon: LucideIcon;
  tone: "mint" | "brand" | "warning" | "coral";
  title: string;
  body: string;
}

function RecommendationsCard({ stats, ratingSeries, parentFirstName }: { stats: ReturnType<typeof useDashboardStats>; ratingSeries: ReturnType<typeof useRatingSeries>; parentFirstName: string }) {
  const lastThree = ratingSeries.data.slice(-3).filter((d) => d.value != null);
  const trend = lastThree.length >= 2 ? (lastThree[lastThree.length - 1].value ?? 0) - (lastThree[0].value ?? 0) : 0;

  const recs: AiRec[] = [];
  if (trend < 0) {
    recs.push({
      icon: Star,
      tone: "warning",
      title: "Evening mood dipping",
      body: `${parentFirstName}'s ratings drifted down over the last few days. A call during dinner could lift spirits.`,
    });
  }
  if (stats.adherenceRate > 0 && stats.adherenceRate < 80) {
    recs.push({
      icon: Pill,
      tone: "coral",
      title: `Medicine adherence at ${stats.adherenceRate}%`,
      body: `Below the 80% comfort line this week. A quick chat about reminders may help.`,
    });
  }
  if (stats.avgSleep > 0 && stats.avgSleep < 6.5) {
    recs.push({
      icon: Moon,
      tone: "brand",
      title: `Sleep averaging ${stats.avgSleep}h`,
      body: "Encourage an earlier wind-down — the after-dinner walk is correlated with better next-morning energy.",
    });
  }
  if (stats.activeDays < 5) {
    recs.push({
      icon: Footprints,
      tone: "mint",
      title: `Only ${stats.activeDays} active day${stats.activeDays === 1 ? "" : "s"} this week`,
      body: "Small, regular movement matters most. Suggest a short stroll on quieter days.",
    });
  }
  if (recs.length === 0) {
    recs.push({
      icon: Sparkles,
      tone: "mint",
      title: "Everything is on track",
      body: `${parentFirstName}'s check-ins, medicines, and activity look steady. Keep the rhythm going — consistency is what keeps families reassured.`,
    });
  }

  return (
    <Card className="h-full overflow-hidden border-border/60 shadow-soft">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Sparkles className="h-4 w-4 text-primary" /> AI Health Spotlight
        </CardTitle>
        <Badge variant="default">Updated live</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {recs.slice(0, 3).map((rec, i) => {
          const toneClass: Record<AiRec["tone"], string> = {
            mint: "bg-secondary/10 text-secondary ring-1 ring-secondary/20",
            brand: "bg-primary/10 text-primary ring-1 ring-primary/20",
            warning: "bg-warning/10 text-warning-foreground ring-1 ring-warning/20",
            coral: "bg-accent/12 text-accent ring-1 ring-accent/20",
          };
          return (
            <motion.div
              key={rec.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="flex items-start gap-3 rounded-2xl border border-border/60 p-3.5 transition-colors hover:border-primary/25"
            >
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", toneClass[rec.tone])}>
                <rec.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{rec.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{rec.body}</p>
              </div>
            </motion.div>
          );
        })}
        <Link
          to="/ai"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          Ask AI Assistant about trends <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}

function UpcomingMedsCard({ medicines, parentId }: { medicines: Medicine[]; parentId: string }) {
  const today = todayISO();
  const todayLogs = useHealthLogs(parentId).data?.filter((l) => l.log_date === today) ?? [];
  const medsTaken = todayLogs.some((l) => l.meds_taken === true);

  return (
    <Card className="h-full border-border/60 shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Clock className="h-4 w-4 text-primary" /> Today's Medications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {medicines.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">No medicines registered.</p>
        ) : (
          medicines.map((med, i) => (
            <div
              key={med.id}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-3",
                i === 0 ? "border-primary/30 bg-primary/5" : "border-border/60 bg-card",
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl font-bold",
                  med.color === "mint" ? "bg-secondary/10 text-secondary" : med.color === "coral" ? "bg-accent/12 text-accent" : "bg-primary/10 text-primary",
                )}
              >
                <Pill className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{med.name}</p>
                <p className="text-xs text-muted-foreground">{med.dosage} · {med.time ? `at ${med.time}` : med.frequency}</p>
              </div>
              {i === 0 && (
                <Badge variant={medsTaken ? "success" : "warning"} className="font-metric">
                  {medsTaken ? "Taken" : "Due"}
                </Badge>
              )}
            </div>
          ))
        )}
        <Link to="/medicines" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
          Manage medication schedules <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}

function TodaysRemindersCard({ medicines, parentId, completedToday }: { medicines: Medicine[]; parentId: string; completedToday: number }) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const today = todayISO();
  const todayLogs = useHealthLogs(parentId).data?.filter((l) => l.log_date === today) ?? [];

  const dueTimes = medicines
    .filter((m) => m.is_active !== false)
    .map((m) => {
      const [h, min] = (((m.time ?? "08:00").padEnd(5, "0")).split(":").map(Number)) as [number, number];
      return { med: m, minutes: h * 60 + min };
    })
    .sort((a, b) => a.minutes - b.minutes);

  const pendingCheckIns = [
    { period: "morning" as TimeOfDay, label: "Morning check-in", time: "08:00", done: Boolean(todayLogs.find((l) => l.log_time_of_day === "morning" && l.hours_slept != null)) },
    { period: "afternoon" as TimeOfDay, label: "Afternoon check-in", time: "13:00", done: Boolean(todayLogs.find((l) => l.log_time_of_day === "afternoon" && l.lunch_details != null)) },
    { period: "evening" as TimeOfDay, label: "Evening check-in", time: "20:00", done: Boolean(todayLogs.find((l) => l.log_time_of_day === "evening" && l.snacks_dinner_details != null)) },
  ].filter((c) => !c.done);

  const upcomingMeds = dueTimes.filter((d) => d.minutes >= nowMinutes).slice(0, 3);
  const overdueMeds = dueTimes.filter((d) => d.minutes < nowMinutes);

  const hasReminders = upcomingMeds.length > 0 || overdueMeds.length > 0 || pendingCheckIns.length > 0;

  return (
    <Card className="h-full flex flex-col border-border/60 shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <BellRing className="h-4 w-4 text-primary" /> Today's Reminders
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {!hasReminders ? (
          <div className="py-5 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-secondary/40" strokeWidth={1.6} />
            <p className="text-sm font-semibold text-foreground">All caught up</p>
            <p className="mt-1 text-xs text-muted-foreground">No pending reminders for now.</p>
          </div>
        ) : (
          <motion.ul
            role="list"
            className="space-y-2.5"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          >
            {overdueMeds.map((d) => (
              <ReminderRow
                key={"overdue-" + d.med.id}
                icon={AlertCircle}
                title={d.med.name}
                sub={d.med.dosage ? `${d.med.dosage} · overdue` : "Overdue"}
                tone="destructive"
              />
            ))}
            {upcomingMeds.map((d) => (
              <ReminderRow
                key={"upcoming-" + d.med.id}
                icon={Pill}
                title={d.med.name}
                sub={d.med.dosage ? `${d.med.dosage} · at ${d.med.time}` : `at ${d.med.time}`}
                tone="brand"
              />
            ))}
            {pendingCheckIns.map((c) => (
              <ReminderRow
                key={"checkin-" + c.period}
                icon={CalendarCheck}
                title={c.label}
                sub={`Due at ${c.time} — ${3 - completedToday} left today`}
                tone="warning"
                action={
                  <Link
                    to="/parent/check-in/morning"
                    aria-label={`Log ${c.label.toLowerCase()}`}
                    className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    Log
                  </Link>
                }
              />
            ))}
          </motion.ul>
        )}
        <Link
          to="/medicines"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          View all schedules <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}

function ReminderRow({ icon: Icon, title, sub, tone, action }: {
  icon: LucideIcon;
  title: string;
  sub: string;
  tone: "brand" | "warning" | "destructive";
  action?: React.ReactNode;
}) {
  const toneClasses = {
    brand: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
  }[tone];
  return (
    <motion.li
      variants={{ show: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 8 } }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex items-center gap-3 rounded-xl border border-border/60 p-2.5"
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toneClasses}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      {action}
    </motion.li>
  );
}

function RecentActivityTimeline({
  logs,
  medicines,
  notifications,
  reports,
  parentFirstName,
}: {
  logs: HealthLog[];
  medicines: Medicine[];
  notifications: AppNotification[];
  reports: Report[];
  parentFirstName: string;
}) {
  type Activity = { id: string; title: string; sub: string; icon: LucideIcon; time: string };
  const items: Activity[] = [];

  for (const l of logs) {
    const periodLabels: Record<TimeOfDay, string> = { morning: "Morning", afternoon: "Afternoon", evening: "Evening" };
    items.push({
      id: l.id,
      title: `${periodLabels[l.log_time_of_day]} check-in logged`,
      sub: parentFirstName,
      icon: CalendarCheck,
      time: l.updated_at,
    });
  }
  for (const m of medicines) {
    items.push({
      id: m.id,
      title: "Medicine added",
      sub: `${m.name} · ${m.dosage ?? m.frequency ?? "—"}`,
      icon: Pill,
      time: m.created_at,
    });
  }
  for (const n of notifications) {
    items.push({
      id: n.id,
      title: n.message ?? n.title ?? "Notification",
      sub: n.type,
      icon: BellRing,
      time: n.sent_at,
    });
  }
  for (const r of reports) {
    items.push({
      id: r.id,
      title: `${r.report_type === "weekly" ? "Weekly" : "Monthly"} report generated`,
      sub: r.report_type,
      icon: FileText,
      time: r.generated_at,
    });
  }

  const sorted = items.sort((a, b) => Date.parse(b.time) - Date.parse(a.time)).slice(0, 8);

  return (
    <Card className="border-border/60 shadow-soft">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Activity className="h-4 w-4 text-primary" /> Recent Activity
        </CardTitle>
        <Link to="/notifications" className="text-xs font-semibold text-primary hover:underline">
          See all <ArrowRight className="inline h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {sorted.length === 0 ? (
          <div className="p-6 text-center">
            <EmptyState
              icon={Activity}
              title="No activity yet"
              description="Check-ins, medicine entries, and family updates will appear here as they happen."
              size="sm"
            />
          </div>
        ) : (
          <motion.ul
            role="list"
            className="divide-y divide-border/50"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.04 } } }}
          >
            {sorted.map((a) => {
              const Icon = a.icon;
              return (
                <motion.li
                  key={a.id}
                  variants={{ show: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 10 } }}
                  className="flex items-center gap-3 px-5 py-3.5 first:rounded-t-2xl first:py-3 last:rounded-b-2xl last:pb-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.sub}</p>
                  </div>
                  <time dateTime={a.time} className="shrink-0 text-xs font-medium text-muted-foreground/70">
                    {relativeTime(a.time)}
                  </time>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </CardContent>
    </Card>
  );
}