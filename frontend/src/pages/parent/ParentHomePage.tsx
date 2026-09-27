import { motion } from "framer-motion";
import { ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, Clock3, Footprints, HeartPulse, Moon, Pill, Sparkles, Star, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ScoreRing } from "@/components/charts/ScoreRing";
import { PageHeader } from "@/components/shared/PageHeader";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { ErrorState } from "@/components/shared/ErrorState";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CHECKIN_WINDOWS } from "@/lib/constants";
import { useDashboardStats, useTodayCheckIns } from "@/hooks/useDashboardData";
import { useLegacyAnswers, useMedicines, useParent, useTodayLegacyQuestion } from "@/hooks/queries";
import { useAuthStore } from "@/stores/authStore";
import { cn, greeting } from "@/lib/utils";
import type { Medicine, TimeOfDay } from "@/types";

import { CardSlider } from "@/components/shared/CardSlider";

const periodIcons: Record<TimeOfDay, typeof Clock3> = {
  morning: Clock3,
  afternoon: Footprints,
  evening: Star,
};

export function ParentHomePage() {
  const parentId = useAuthStore((s) => s.parentId);
  const { data: parent, isLoading, isError, refetch } = useParent(parentId ?? "p-mom");
  const { status, completed, missedCount } = useTodayCheckIns(parentId ?? "p-mom");
  const stats = useDashboardStats(parentId ?? "p-mom");
  const { data: medicines } = useMedicines(parentId ?? "p-mom");
  const { data: legacyAnswers } = useLegacyAnswers();
  const { data: todayQuestion } = useTodayLegacyQuestion();
  const navigate = useNavigate();

  const myLegacy = legacyAnswers?.filter((a) => a.parent_id === parentId) ?? [];

  if (isLoading) return <ParentHomeSkeleton />;
  if (isError || !parent) {
    return <ErrorState title="Your daily overview is unavailable" onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={greeting()}
        title={`Welcome back, ${parent.first_name}`}
        description={`Here's how you're doing today — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}.`}
        actions={
           <Button onClick={() => navigate("/parent/check-ins")}>
            <ClipboardCheck className="h-4 w-4" /> {completed === 3 ? "View today" : missedCount >= 1 ? "Continue check-in" : "Start check-in"}
          </Button>
        }
      />

      {missedCount > 0 && completed < 3 && (
         <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-start gap-3 rounded-xl border border-warning/20 bg-warning/8 px-5 py-4 sm:flex-row sm:items-center">
          <Clock3 className="h-5 w-5 shrink-0 text-warning-foreground" />
          <div className="flex-1 text-sm">
             <p className="font-semibold text-foreground">You've missed {missedCount} check-in{missedCount > 1 ? "s" : ""} today</p>
            <p className="text-xs text-muted-foreground">A quick update helps your family stay reassured and spot patterns early.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate("/parent/check-ins")}>
            Update now
          </Button>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
           <Card className="relative h-full overflow-hidden border-slate-900/10 bg-slate-950 text-white shadow-soft-lg dark:border-white/10">
             <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-primary/25 blur-3xl" />
            <CardContent className="relative flex h-full flex-col p-6">
              <div className="flex items-center gap-3">
                <PersonAvatar first={parent.first_name} last={parent.last_name} src={parent.avatar_url} color={parent.avatar_color} className="h-10 w-10 ring-2 ring-white/30" />
                <div>
                   <p className="text-sm font-semibold text-white">Your health today</p>
                  <p className="text-xs text-white/70">{completed === 3 ? "All check-ins complete" : `${completed} of 3 check-ins done`}</p>
                </div>
              </div>
              <div className="my-auto flex items-center justify-center py-6">
                <ScoreRing
                  value={stats.dailyHealthScore}
                  label={`${stats.dailyHealthScore}`}
                  sublabel="health score"
                  size={172}
                  strokeWidth={13}
                   color="#ffffff"
                   trackColor="rgba(255,255,255,0.2)"
                   textClassName="text-white"
                   sublabelClassName="text-white/70"
                />
              </div>
               <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-white/75">
                <TrendingUp className={cn("h-3.5 w-3.5", stats.scoreDelta < 0 && "rotate-180")} />
                {Math.abs(stats.scoreDelta)}% vs last week
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Desktop/Tablet Grid */}
        <div className="hidden sm:grid sm:grid-cols-2 gap-4 lg:col-span-2">
          <StatCard icon={Moon} label="Avg. sleep" value={`${stats.avgSleep}h`} sublabel="last 7 nights" delta={stats.sleepDelta} iconColor="brand" index={0} />
          <StatCard icon={Pill} label="Medicine adherence" value={`${stats.adherenceRate}%`} sublabel="7-day average" delta={stats.adherenceDelta} iconColor="mint" index={1} />
          <StatCard icon={HeartPulse} label="Active days" value={`${stats.activeDays}/7`} sublabel="logged activity" delta={stats.activeDaysDelta} iconColor="coral" index={2} />
          <StatCard icon={Star} label="Day rating" value={stats.dailyHealthScore > 0 ? `${Math.round(stats.dailyHealthScore / 10)}/10` : "—"} sublabel="this week" iconColor="warning" index={3} />
        </div>

        {/* Mobile Horizontal Carousel */}
        <div className="sm:hidden lg:col-span-2 -mx-4 px-4">
          <CardSlider itemClassName="w-[74vw] max-w-[280px]" showDots>
            <StatCard icon={Moon} label="Avg. sleep" value={`${stats.avgSleep}h`} sublabel="last 7 nights" delta={stats.sleepDelta} iconColor="brand" index={0} />
            <StatCard icon={Pill} label="Medicine adherence" value={`${stats.adherenceRate}%`} sublabel="7-day average" delta={stats.adherenceDelta} iconColor="mint" index={1} />
            <StatCard icon={HeartPulse} label="Active days" value={`${stats.activeDays}/7`} sublabel="logged activity" delta={stats.activeDaysDelta} iconColor="coral" index={2} />
            <StatCard icon={Star} label="Day rating" value={stats.dailyHealthScore > 0 ? `${Math.round(stats.dailyHealthScore / 10)}/10` : "—"} sublabel="this week" iconColor="warning" index={3} />
          </CardSlider>
        </div>
      </div>

      {/* Desktop Grid */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
        <TodayCheckInsCard status={status} onNavigate={navigate} />
        <MedsCard medicines={medicines ?? []} onNavigate={navigate} />
        <LegacyCard question={todayQuestion?.question_text ?? ""} myCount={myLegacy.length} onNavigate={navigate} />
      </div>

      {/* Mobile/Tablet Carousel */}
      <div className="lg:hidden -mx-4 px-4">
        <CardSlider itemClassName="w-[85vw] max-w-[420px]" showDots showArrows>
          <TodayCheckInsCard status={status} onNavigate={navigate} />
          <MedsCard medicines={medicines ?? []} onNavigate={navigate} />
          <LegacyCard question={todayQuestion?.question_text ?? ""} myCount={myLegacy.length} onNavigate={navigate} />
        </CardSlider>
      </div>
    </div>
  );
}

function TodayCheckInsCard({ status, onNavigate }: { status: Record<TimeOfDay, boolean>; onNavigate: (p: string) => void }) {
  const doneCount = Object.values(status).filter(Boolean).length;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
      <Card className="h-full border-border/60 shadow-soft">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <ClipboardCheck className="h-4 w-4 text-primary" /> Today's check-ins
          </CardTitle>
          <Badge variant={doneCount === 3 ? "success" : "warning"}>{doneCount}/3 done</Badge>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {(Object.keys(CHECKIN_WINDOWS) as TimeOfDay[]).map((period) => {
            const done = status[period];
            const meta = CHECKIN_WINDOWS[period];
            const Icon = periodIcons[period];
            return (
              <motion.button
                key={period}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate(`/parent/check-in/${period}`)}
                className={cn(
                   "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-[border-color,background-color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 motion-reduce:transform-none",
                   done ? "border-secondary/20 bg-secondary/5" : "border-border/70 bg-card/70 hover:border-primary/30 hover:bg-card hover:shadow-soft-xs",
                )}
              >
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl font-bold", done ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary")}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                   <p className="text-sm font-semibold text-foreground">{meta.label}</p>
                  <p className="text-xs text-muted-foreground">{meta.time} · {meta.description}</p>
                </div>
                {done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-secondary" />
                ) : (
                  <Badge variant="outline">Tap to log</Badge>
                )}
              </motion.button>
            );
          })}
           <Link to="/parent/check-ins" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15">
            View history <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MedsCard({ medicines, onNavigate }: { medicines: Medicine[]; onNavigate: (p: string) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
      <Card className="h-full border-border/60 shadow-soft">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Pill className="h-4 w-4 text-secondary" /> Today's medicines
          </CardTitle>
          <Badge variant="muted">{medicines.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {medicines.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No medicines registered.</p>
          ) : (
            medicines.map((med) => (
               <div key={med.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/70 p-3">
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl font-bold", med.color === "mint" ? "bg-secondary/10 text-secondary" : med.color === "coral" ? "bg-accent/12 text-accent" : "bg-primary/10 text-primary")}>
                  <Pill className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{med.name}</p>
                  <p className="text-xs text-muted-foreground">{med.dosage} · {med.time ? `at ${med.time}` : med.frequency}</p>
                </div>
              </div>
            ))
          )}
          <Button variant="outline" size="sm" className="w-full" onClick={() => onNavigate("/parent/health")}>
            See my health <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LegacyCard({ question, myCount, onNavigate }: { question: string; myCount: number; onNavigate: (p: string) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
      <Card className="h-full overflow-hidden border-border/60 shadow-soft">
        <div className="h-1.5 w-full bg-gradient-hero" />
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <BookOpen className="h-4 w-4 text-accent" /> Legacy & memories
          </CardTitle>
          <Badge variant="accent">{myCount} shared</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="rounded-xl border border-border/60 bg-muted/35 p-4">
             <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Question of the day</p>
            <p className="mt-1.5 text-sm font-semibold leading-relaxed text-foreground">{question || "What should we remember about you?"}</p>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Your answers become a lasting keepsake your family will treasure — like a digital letter from you.
          </p>
           <Button variant="accent" className="w-full" onClick={() => onNavigate("/parent/legacy")}>
            <Sparkles className="h-4 w-4" /> Answer the question
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ParentHomeSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading your daily overview">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-64 rounded-xl" />
        <Skeleton className="h-4 w-80 max-w-full rounded-md" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Dark health score card */}
        <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-3 w-36 rounded-md" />
            </div>
          </div>
          <div className="flex justify-center py-4">
            <Skeleton className="h-36 w-36 rounded-full" />
          </div>
          <div className="flex justify-center">
            <Skeleton className="h-4 w-32 rounded-md" />
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/50 bg-card p-4 space-y-3 shadow-soft-xs">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-20 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-xl" />
              </div>
              <Skeleton className="h-7 w-16 rounded-md" />
              <Skeleton className="h-3 w-24 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* 3 Widgets */}
      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/50 bg-card p-5 space-y-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-md" />
                <Skeleton className="h-4 w-28 rounded-md" />
              </div>
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <div className="space-y-2.5">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
