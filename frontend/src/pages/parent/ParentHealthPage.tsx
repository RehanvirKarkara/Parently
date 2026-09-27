import { motion } from "framer-motion";
import { CalendarDays, Footprints, Moon, Pill, Star, TrendingUp } from "lucide-react";
import { useDashboardStats, useAdherenceSeries, useRatingSeries, useSleepSeries, useStepsSeries } from "@/hooks/useDashboardData";
import { useMedicines, useParent } from "@/hooks/queries";
import { useAuthStore } from "@/stores/authStore";
import { HealthChart } from "@/components/charts/HealthChart";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { ProfilePictureUpload } from "@/components/shared/ProfilePictureUpload";
import { CardSlider } from "@/components/shared/CardSlider";

export function ParentHealthPage() {
  const parentId = useAuthStore((s) => s.parentId) ?? "p-mom";
  const updateParentAvatar = useAuthStore((s) => s.updateParentAvatar);
  const { data: parent, isLoading: loadingParent, isError, refetch } = useParent(parentId);
  const stats = useDashboardStats(parentId);
  const sleepSeries = useSleepSeries(parentId);
  const stepsSeries = useStepsSeries(parentId);
  const ratingSeries = useRatingSeries(parentId);
  const adherenceSeries = useAdherenceSeries(parentId);
  const { data: medicines, isLoading: loadingMeds } = useMedicines(parentId);

  if (loadingParent) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading health data" aria-busy="true">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44 rounded-xl" />
          <Skeleton className="h-4 w-72 max-w-full rounded-md" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/50 bg-card p-4 space-y-3 shadow-soft-xs">
              <div className="flex justify-between items-center">
                <Skeleton className="h-3.5 w-20 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-xl" />
              </div>
              <Skeleton className="h-7 w-16 rounded-md" />
              <Skeleton className="h-3 w-24 rounded-md" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl border border-border/50 bg-card p-5 space-y-4 shadow-soft">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-24 rounded-md" />
                <Skeleton className="h-4 w-32 rounded-md" />
              </div>
              <Skeleton className="h-44 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !parent) {
    return <ErrorState title="Your health trends are unavailable" onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Your data"
        title="My health"
        description={`A private look at your trends over the last two weeks, ${parent.first_name}.`}
        actions={<Badge variant="muted" className="px-3 py-1.5"><CalendarDays className="h-3.5 w-3.5" /> Last 14 days</Badge>}
      />

      {/* Desktop/Tablet Grid */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Moon} label="Avg. sleep" value={`${stats.avgSleep}h`} sublabel="last 7 nights" delta={stats.sleepDelta} iconColor="brand" index={0} />
        <StatCard icon={Pill} label="Adherence" value={`${stats.adherenceRate}%`} sublabel="medicines taken" delta={stats.adherenceDelta} iconColor="mint" index={1} />
        <StatCard icon={Footprints} label="Active days" value={`${stats.activeDays}/7`} sublabel="logged activity" delta={stats.activeDaysDelta} iconColor="coral" index={2} />
        <StatCard icon={Star} label="Health score" value={`${stats.dailyHealthScore}`} sublabel="this week" delta={stats.scoreDelta} iconColor="warning" index={3} />
      </div>

      {/* Mobile Horizontal Carousel */}
      <div className="sm:hidden -mx-4 px-4">
        <CardSlider itemClassName="w-[74vw] max-w-[280px]" showDots>
          <StatCard icon={Moon} label="Avg. sleep" value={`${stats.avgSleep}h`} sublabel="last 7 nights" delta={stats.sleepDelta} iconColor="brand" index={0} />
          <StatCard icon={Pill} label="Adherence" value={`${stats.adherenceRate}%`} sublabel="medicines taken" delta={stats.adherenceDelta} iconColor="mint" index={1} />
          <StatCard icon={Footprints} label="Active days" value={`${stats.activeDays}/7`} sublabel="logged activity" delta={stats.activeDaysDelta} iconColor="coral" index={2} />
          <StatCard icon={Star} label="Health score" value={`${stats.dailyHealthScore}`} sublabel="this week" delta={stats.scoreDelta} iconColor="warning" index={3} />
        </CardSlider>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
         <ChartCard title="Sleep" subtitle="Hours per night" series={sleepSeries} unit="h" color="hsl(var(--primary))" />
         <ChartCard title="Steps" subtitle="Daily step count" series={stepsSeries} unit="steps" color="hsl(var(--secondary))" />
         <ChartCard title="Day rating" subtitle="Evening mood 1–10" series={ratingSeries} unit="/10" color="hsl(var(--accent))" yDomain={[1, 10]} />
         <ChartCard title="Medicine adherence" subtitle="Daily % of medicines taken" series={adherenceSeries} unit="%" color="hsl(var(--secondary))" yDomain={[0, 100]} />
      </div>

      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Pill className="h-4 w-4 text-primary" /> My Profile Photo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProfilePictureUpload
            first={parent.first_name}
            last={parent.last_name}
            avatarUrl={parent.avatar_url}
            color={parent.avatar_color}
            onAvatarChange={(newUrl) => updateParentAvatar(newUrl)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Pill className="h-4 w-4 text-secondary" /> My medicines
          </CardTitle>
          <Badge variant="muted">{medicines?.length ?? 0} active</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingMeds ? (
            <div className="space-y-2.5" aria-busy="true">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : !medicines || medicines.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No medicines registered. Ask a family member to add yours.
            </p>
          ) : (
            medicines?.map((med) => (
               <motion.div key={med.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/70 p-4">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", med.color === "mint" ? "bg-secondary/10 text-secondary" : med.color === "coral" ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary")}>
                  <Pill className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{med.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {med.dosage} · {med.frequency}
                    {med.time ? ` · at ${med.time}` : ""}
                    {med.instructions ? ` · ${med.instructions}` : ""}
                  </p>
                </div>
                <TrendingUp className="h-4 w-4 shrink-0 text-secondary" />
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="pb-4 text-center text-xs text-muted-foreground">
        Your data stays private — only your family circle can see it.
      </p>
    </div>
  );
}

function ChartCard({ title, subtitle, series, unit, color, yDomain }: { title: string; subtitle: string; series: ReturnType<typeof useSleepSeries>; unit: string; color: string; yDomain?: [number, number] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </CardHeader>
        <CardContent>
          {series.data.length === 0 ? (
             <div className="flex h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-center">
               <CalendarDays className="mb-2 h-6 w-6 text-muted-foreground/50" />
               <p className="text-sm text-muted-foreground">No data for this trend yet</p>
             </div>
          ) : (
            <HealthChart series={series} unit={unit} color={color} height={200} yDomain={yDomain} />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
