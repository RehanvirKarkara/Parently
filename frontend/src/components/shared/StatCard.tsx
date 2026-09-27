import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sublabel?: string;
  delta?: number;
  deltaLabel?: string;
  iconColor?: "brand" | "mint" | "coral" | "warning" | "slate";
  index?: number;
  trend?: "up" | "down";
}

const iconConfig: Record<string, { bg: string; text: string; accentLine: string; gradient: string }> = {
  brand: {
    bg: "bg-primary/10",
    text: "text-primary",
    accentLine: "from-primary to-secondary-accent",
    gradient: "from-primary/8 to-secondary-accent/5",
  },
  mint: {
    bg: "bg-secondary/10",
    text: "text-secondary",
    accentLine: "from-secondary to-secondary/50",
    gradient: "from-secondary/8 to-secondary/3",
  },
  coral: {
    bg: "bg-accent/12",
    text: "text-accent",
    accentLine: "from-accent to-accent/50",
    gradient: "from-accent/8 to-accent/3",
  },
  warning: {
    bg: "bg-warning/10",
    text: "text-warning-foreground",
    accentLine: "from-warning to-warning/50",
    gradient: "from-warning/8 to-warning/3",
  },
  slate: {
    bg: "bg-muted/60",
    text: "text-muted-foreground",
    accentLine: "from-muted-foreground to-muted-foreground/40",
    gradient: "from-muted/50 to-muted/20",
  },
};

export function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  delta,
  iconColor = "brand",
  index = 0,
}: StatCardProps) {
  const positive = (delta ?? 0) >= 0;
  const showDelta = delta !== undefined && delta !== 0;
  const config = iconConfig[iconColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={cn(
        "relative flex min-h-[10.5rem] flex-col gap-4 overflow-hidden rounded-[1.25rem] border border-border/70 bg-card/95 p-5 shadow-soft-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/15 hover:shadow-soft-md motion-reduce:transform-none",
      )}
    >
      {/* Subtle gradient background tint */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30", config.gradient)} />

      {/* Top colored accent line */}
      <div className={cn("absolute inset-x-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r", config.accentLine)} />

      <div className="relative flex items-start justify-between">
        {/* Icon */}
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl",
            config.bg,
            config.text,
          )}
        >
          <Icon className="h-[22px] w-[22px]" strokeWidth={1.8} />
        </div>

        {/* Delta badge */}
        {showDelta && (
          <div
            className={cn(
              "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
              positive
                ? "bg-secondary/10 text-secondary"
                : "bg-destructive/10 text-destructive",
            )}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta!)}%
          </div>
        )}
      </div>

      {/* Value */}
      <div className="relative">
        <p className="font-metric text-[1.75rem] font-semibold leading-none tracking-[-0.035em] text-foreground">
          {value}
        </p>
        <p className="mt-1.5 text-[13px] font-medium text-muted-foreground">{label}</p>
        {sublabel && <p className="mt-1 text-xs leading-4 text-muted-foreground/75">{sublabel}</p>}
      </div>
    </motion.div>
  );
}
