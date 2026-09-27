import { useMemo } from "react";
import { useHealthLogs } from "@/hooks/queries";
import { todayISO } from "@/lib/utils";
import type { ChartSeries, DashboardStats, HealthLog } from "@/types";

function avg(nums: (number | null | undefined)[]): number {
  const clean = nums.filter((n): n is number => typeof n === "number" && !Number.isNaN(n));
  if (!clean.length) return 0;
  return clean.reduce((a, b) => a + b, 0) / clean.length;
}

function pctChange(current: number, previous: number): number {
  if (!previous) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function computeDashboardStats(logs: HealthLog[]): DashboardStats {
  const byDate = new Map<string, HealthLog[]>();
  for (const log of logs) {
    const arr = byDate.get(log.log_date) ?? [];
    arr.push(log);
    byDate.set(log.log_date, arr);
  }

  const dates = [...byDate.keys()].sort();
  const recentDates = dates.slice(-7);
  const priorDates = dates.slice(-14, -7);

  const scoreFor = (ds: string[]) => {
    const vals = ds.map((d) => {
      const dayLogs = byDate.get(d) ?? [];
      const rating = dayLogs.find((l) => l.day_rating != null)?.day_rating;
      const sleep = dayLogs.find((l) => l.hours_slept != null)?.hours_slept;
      const meds = dayLogs.filter((l) => l.meds_taken != null);
      const steps = dayLogs.reduce((s, l) => s + (l.steps_walked_afternoon ?? 0) + (l.steps_walked_evening ?? 0), 0);
      const adherence = meds.length ? meds.filter((l) => l.meds_taken).length / meds.length : 0;
      let score = 0;
      if (rating != null) score += (rating / 10) * 50;
      if (sleep != null) score += Math.min(1, sleep / 8) * 25;
      score += adherence * 15;
      score += Math.min(1, steps / 10000) * 10;
      return score;
    });
    return vals.length ? avg(vals) : 0;
  };

  const adherenceFor = (ds: string[]) => {
    const meds = ds.flatMap((d) => (byDate.get(d) ?? []).filter((l) => l.meds_taken != null));
    if (!meds.length) return 0;
    return (meds.filter((l) => l.meds_taken).length / meds.length) * 100;
  };

  const sleepFor = (ds: string[]) => {
    const sleeps = ds.flatMap((d) => (byDate.get(d) ?? []).map((l) => l.hours_slept));
    return avg(sleeps);
  };

  const recent = scoreFor(recentDates);
  const prior = scoreFor(priorDates);
  const recentAdherence = adherenceFor(recentDates);
  const priorAdherence = adherenceFor(priorDates);
  const recentSleep = sleepFor(recentDates);
  const priorSleep = sleepFor(priorDates);

  return {
    dailyHealthScore: Math.round(recent),
    scoreDelta: pctChange(recent, prior),
    adherenceRate: Math.round(recentAdherence),
    adherenceDelta: Math.round(pctChange(recentAdherence, priorAdherence)),
    avgSleep: Math.round(recentSleep * 10) / 10,
    sleepDelta: Math.round((recentSleep - priorSleep) * 10) / 10,
    activeDays: recentDates.filter((d) => {
      const dayLogs = byDate.get(d) ?? [];
      return dayLogs.filter((l) => l.log_time_of_day !== "morning" || l.hours_slept != null).length >= 1;
    }).length,
    activeDaysDelta: Math.max(0, recentDates.length - priorDates.filter((d) => (byDate.get(d) ?? []).length >= 2).length),
    medsDueToday: 0,
  };
}

export function useDashboardStats(parentId?: string): DashboardStats {
  const { data: logs } = useHealthLogs(parentId);
  return useMemo(() => computeDashboardStats(logs ?? []), [logs]);
}

function buildSeries(logs: HealthLog[], selector: (l: HealthLog) => number | null): ChartSeries {
  const byDate = new Map<string, number | null>();
  for (const log of logs) {
    const v = selector(log);
    if (v != null && !byDate.has(log.log_date)) byDate.set(log.log_date, v);
  }
  const dates = [...byDate.keys()].sort().slice(-14);
  return {
    name: "value",
    data: dates.map((date) => ({
      date,
      label: new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: byDate.get(date) ?? null,
    })),
  };
}

export function useSleepSeries(parentId?: string): ChartSeries {
  const { data: logs } = useHealthLogs(parentId);
  return useMemo(() => buildSeries(logs ?? [], (l) => l.hours_slept), [logs]);
}

export function useStepsSeries(parentId?: string): ChartSeries {
  const { data: logs } = useHealthLogs(parentId);
  return useMemo(
    () =>
      buildSeries(
        logs ?? [],
        (l) => (l.steps_walked_afternoon ?? 0) + (l.steps_walked_evening ?? 0) || null,
      ),
    [logs],
  );
}

export function useRatingSeries(parentId?: string): ChartSeries {
  const { data: logs } = useHealthLogs(parentId);
  return useMemo(() => buildSeries(logs ?? [], (l) => l.day_rating), [logs]);
}

export function useAdherenceSeries(parentId?: string): ChartSeries {
  const { data: logs } = useHealthLogs(parentId);
  return useMemo(() => {
    const byDate = new Map<string, { taken: number; total: number }>();
    for (const log of logs ?? []) {
      if (log.meds_taken == null) continue;
      const entry = byDate.get(log.log_date) ?? { taken: 0, total: 0 };
      entry.total += 1;
      if (log.meds_taken) entry.taken += 1;
      byDate.set(log.log_date, entry);
    }
    const dates = [...byDate.keys()].sort().slice(-14);
    return {
      name: "value",
      data: dates.map((date) => ({
        date,
        label: new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: Math.round((byDate.get(date)!.taken / byDate.get(date)!.total) * 100),
      })),
    };
  }, [logs]);
}

/** Today's check-in status for a parent. */
export function useTodayCheckIns(parentId?: string) {
  const { data: logs } = useHealthLogs(parentId);
  const today = todayISO();
  const dayLogs = (logs ?? []).filter((l) => l.log_date === today);
  const status: Record<"morning" | "afternoon" | "evening", boolean> = {
    morning: dayLogs.some((l) => l.log_time_of_day === "morning" && l.hours_slept != null),
    afternoon: dayLogs.some((l) => l.log_time_of_day === "afternoon" && l.lunch_details != null),
    evening: dayLogs.some((l) => l.log_time_of_day === "evening" && l.snacks_dinner_details != null),
  };
  const missed = Object.values(status).filter(Boolean).length;
  return { status, completed: missed, missedCount: 3 - missed };
}
