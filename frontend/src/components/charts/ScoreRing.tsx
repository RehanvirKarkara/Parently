import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";

interface ScoreRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: string;
  trackColor?: string;
  textClassName?: string;
  sublabelClassName?: string;
}

export function ScoreRing({
  value,
  max = 100,
  size = 140,
  strokeWidth = 12,
  label,
  sublabel,
  color = "hsl(var(--primary))",
  trackColor = "hsl(var(--border))",
  textClassName,
  sublabelClassName,
}: ScoreRingProps) {
  const reduceMotion = useReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label ?? `${Math.round(pct)} out of ${max}`}${sublabel ? `, ${sublabel}` : ""}`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: reduceMotion ? 0 : 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {label !== undefined ? (
          <>
             <span className={cn("font-metric text-[1.75rem] font-semibold tracking-[-0.035em]", textClassName ?? "text-foreground")}>
              {label}
            </span>
             {sublabel && <span className={cn("mt-0.5 text-xs font-semibold", sublabelClassName ?? "text-muted-foreground")}>{sublabel}</span>}
          </>
        ) : (
          <>
            <AnimatedCounter
              value={Math.round(pct)}
               className={cn("font-metric text-[1.75rem] font-semibold tracking-[-0.035em]", textClassName ?? "text-foreground")}
            />
             <span className={cn("mt-0.5 text-xs font-semibold", sublabelClassName ?? "text-muted-foreground")}>/ {max}</span>
          </>
        )}
      </div>
    </div>
  );
}

export function MiniRing({
  value,
  size = 64,
  strokeWidth = 6,
  className,
  color = "hsl(var(--primary))",
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
}) {
  const reduceMotion = useReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${Math.round(value)} percent`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: reduceMotion ? "none" : "stroke-dashoffset 900ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <span className="absolute font-metric text-xs font-bold text-foreground">
        {Math.round(value)}%
      </span>
    </div>
  );
}
