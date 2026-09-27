import { motion } from "framer-motion";
import { CalendarDays, ChevronDown, FileText, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useGenerateReport, useReports } from "@/hooks/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { AIThinkingIndicator } from "@/components/shared/AIThinkingIndicator";
import { formatDate, relativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Report } from "@/types";

export function ReportsPage() {
  const { data: reports, isLoading, isError, refetch } = useReports();
  const generateReport = useGenerateReport();
  const [filter, setFilter] = useState<"all" | "weekly" | "monthly">("all");

  const filtered = (reports ?? []).filter((r) => filter === "all" || r.report_type === filter);

  const onGenerate = (type: "weekly" | "monthly") => {
    generateReport.mutate(type, {
      onSuccess: () => toast.success(`${type === "weekly" ? "Weekly" : "Monthly"} report ready`),
      onError: () => toast.error("Report generation failed"),
    });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title="Health Reports"
        description="AI-generated summaries that turn daily check-ins into clear family insights."
        actions={
          <div className="flex flex-wrap items-center gap-2">
             <Button variant="outline" onClick={() => onGenerate("weekly")} disabled={generateReport.isPending} aria-busy={generateReport.isPending}>
              {generateReport.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
              Weekly report
            </Button>
             <Button onClick={() => onGenerate("monthly")} disabled={generateReport.isPending} aria-busy={generateReport.isPending}>
              {generateReport.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Monthly summary
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex w-fit items-center gap-1 rounded-xl border border-border/70 bg-card/90 p-1 shadow-soft-xs" role="group" aria-label="Report type">
        {(["all", "weekly", "monthly"] as const).map((f) => (
          <button
             key={f}
             type="button"
             aria-pressed={filter === f}
             onClick={() => setFilter(f)}
            className={cn(
               "min-h-9 rounded-lg px-4 py-2 text-xs font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
               filter === f ? "bg-primary/8 text-primary ring-1 ring-primary/10" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* AI Processing Banner when Generating Report */}
      {generateReport.isPending && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mb-6 rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/8 via-secondary/8 to-primary/8 p-5 shadow-soft-sm backdrop-blur-md"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Sparkles className="h-5 w-5 animate-pulse text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Generating Health Intelligence Summary…
              </p>
              <AIThinkingIndicator
                stages={[
                  "Aggregating 7-day health check-ins and sleep vitals…",
                  "Evaluating medication adherence and lifestyle trends…",
                  "Synthesizing family wellness report narrative…",
                ]}
                className="mt-1.5"
              />
            </div>
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="space-y-4" role="status" aria-label="Loading reports">
          {[0, 1, 2].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-border/70 bg-card p-5 space-y-3 shadow-soft-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-12 rounded-xl shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-40 rounded" />
                    <Skeleton className="h-3 w-28 rounded" />
                  </div>
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-12 w-full rounded-xl mt-3" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState title="Reports are unavailable" onRetry={() => void refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports yet"
          description="Generate your first weekly or monthly report to see AI-summarized family health trends."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((report, i) => (
            <ReportCard key={report.id} report={report} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({ report, index }: { report: Report; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const isWeekly = report.report_type === "weekly";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="overflow-hidden rounded-xl border border-border/70 bg-card/90 shadow-soft-xs transition-[border-color,box-shadow] hover:border-primary/20 hover:shadow-soft"
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-controls={`report-${report.id}-content`}
        className="flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-primary/15 sm:p-5"
      >
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", isWeekly ? "bg-primary/10 text-primary ring-1 ring-primary/10" : "bg-secondary/10 text-secondary ring-1 ring-secondary/10")}>
          <FileText className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
             <p className="font-heading text-base font-semibold capitalize text-foreground">{report.report_type} report</p>
            <Badge variant={isWeekly ? "default" : "secondary"}>{isWeekly ? "Weekly" : "Monthly"}</Badge>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(report.report_period_start)} – {formatDate(report.report_period_end)}
            <span className="text-muted-foreground/50">·</span>
            {relativeTime(report.generated_at)}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary">
          {expanded ? "Hide" : "Read"}
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", expanded && "rotate-180")} />
        </span>
      </button>
      {expanded && (
        <motion.div id={`report-${report.id}-content`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-border/60 bg-muted/20 p-5">
          <p className="text-sm leading-relaxed text-foreground/90">{report.content}</p>
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-primary/10 bg-primary/5 p-4">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs font-medium text-muted-foreground">Generated by Parently AI from your family's daily check-in data.</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
