import { Skeleton } from "@/components/ui/skeleton";

/**
 * Realistic Dashboard Skeleton matching exact card geometry to prevent layout shift.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300" role="status" aria-label="Loading care dashboard">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-36 rounded-full" />
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-4 w-80 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* Hero Well-being Banner Skeleton */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-full shrink-0" />
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-40 rounded-lg" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-4 w-72 rounded-md" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-8 w-28 rounded-xl" />
                <Skeleton className="h-8 w-32 rounded-xl" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 border-t border-border/50 pt-4 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
            <div className="space-y-2 text-right">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-8 w-16 ml-auto rounded-lg" />
              <Skeleton className="h-3 w-20 ml-auto rounded" />
            </div>
            <Skeleton className="size-24 rounded-full shrink-0" />
          </div>
        </div>
      </div>

      {/* Check-in Timeline Cards Skeleton */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-48 rounded-lg" />
            <Skeleton className="h-3 w-36 rounded" />
          </div>
          <Skeleton className="h-4 w-20 rounded" />
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-8 rounded-xl" />
                  <Skeleton className="h-4 w-28 rounded" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="space-y-2 pt-2 border-t border-border/40">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-4/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4 Stat Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 shadow-soft-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="size-10 rounded-xl" />
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-3.5 w-32 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Realistic Quiz Skeleton
 */
export function QuizSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-in fade-in duration-300" role="status" aria-label="Loading quiz">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-6 w-48 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8 space-y-6 shadow-soft">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        </div>

        <Skeleton className="h-6 w-4/5 rounded-lg" />

        <div className="space-y-3 pt-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Realistic Medicine List Skeleton
 */
export function MedicationSkeleton() {
  return (
    <div className="space-y-3 animate-in fade-in duration-300" role="status" aria-label="Loading medications">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl border border-border/70 bg-card/90 p-4 shadow-soft-xs sm:p-5"
        >
          <Skeleton className="size-12 rounded-xl shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-36 rounded-lg" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-3 w-48 rounded" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-8 w-20 rounded-xl hidden sm:block" />
            <Skeleton className="size-9 rounded-lg" />
            <Skeleton className="size-9 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Realistic Health Logs Skeleton
 */
export function LogsSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300" role="status" aria-label="Loading health logs">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border/70 bg-card p-4 space-y-2">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-6 w-16 rounded-lg" />
          </div>
        ))}
      </div>

      {/* 2 Charts Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-3">
          <Skeleton className="h-5 w-32 rounded-lg" />
          <Skeleton className="h-3 w-48 rounded" />
          <Skeleton className="h-44 w-full rounded-xl mt-4" />
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-3">
          <Skeleton className="h-5 w-32 rounded-lg" />
          <Skeleton className="h-3 w-48 rounded" />
          <Skeleton className="h-44 w-full rounded-xl mt-4" />
        </div>
      </div>

      {/* Timeline Days */}
      <div className="space-y-4">
        {[0, 1].map((day) => (
          <div key={day} className="rounded-2xl border border-border/70 bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40 rounded-lg" />
              <Skeleton className="h-4 w-24 rounded-full" />
            </div>
            <div className="space-y-3">
              {[0, 1, 2].map((slot) => (
                <div key={slot} className="flex items-center gap-3 p-3 rounded-xl border border-border/50">
                  <Skeleton className="size-8 rounded-lg shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-3 w-48 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Realistic Family Page Skeleton
 */
export function FamilySkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2 animate-in fade-in duration-300" role="status" aria-label="Loading care circle">
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
        <Skeleton className="h-5 w-36 rounded-lg" />
        <div className="space-y-3 pt-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-border/50 p-3.5">
              <Skeleton className="size-10 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-3 w-40 rounded" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
        <Skeleton className="h-5 w-40 rounded-lg" />
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3 rounded-xl border border-warning/20 bg-warning/5 p-3.5">
            <Skeleton className="size-10 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-44 rounded" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Realistic Chat Messages Skeleton
 */
export function ChatSkeleton() {
  return (
    <div className="space-y-5 px-4 py-5 animate-in fade-in duration-300" role="status" aria-label="Loading conversation">
      {/* Assistant bubble */}
      <div className="flex gap-3">
        <Skeleton className="size-8 rounded-lg shrink-0 mt-0.5" />
        <div className="space-y-2 max-w-[72%]">
          <Skeleton className="h-16 w-80 rounded-2xl rounded-tl-sm" />
        </div>
      </div>

      {/* User bubble */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-56 rounded-2xl rounded-tr-sm bg-primary/20" />
      </div>

      {/* Assistant response */}
      <div className="flex gap-3">
        <Skeleton className="size-8 rounded-lg shrink-0 mt-0.5" />
        <div className="space-y-2 max-w-[72%]">
          <Skeleton className="h-24 w-96 rounded-2xl rounded-tl-sm" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Realistic Notifications Skeleton
 */
export function NotificationsSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300" role="status" aria-label="Loading notifications">
      <Skeleton className="h-3.5 w-32 rounded" />
      <div className="space-y-2.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-4 rounded-xl border border-border/60 bg-card p-4 sm:p-5">
            <Skeleton className="size-11 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <Skeleton className="h-4 w-48 rounded" />
              <Skeleton className="h-3 w-72 rounded" />
            </div>
            <Skeleton className="h-3 w-16 rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
