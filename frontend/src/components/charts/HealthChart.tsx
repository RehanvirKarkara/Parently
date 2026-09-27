import { useId } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartSeries } from "@/types";

interface HealthChartProps {
  series: ChartSeries;
  height?: number;
  color?: string;
  unit?: string;
  type?: "line" | "area";
  yDomain?: [number, number];
  showDots?: boolean;
}

interface TooltipEntry {
  label?: string;
  payload?: Array<{ value?: number | string; name?: string; color?: string; payload?: { label?: string } }>;
}

function ChartTooltip({ active, payload, label, unit }: { active?: boolean; payload?: TooltipEntry["payload"]; label?: string; unit?: string }) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  return (
    <div className="surface-overlay min-w-32 rounded-xl px-3.5 py-3">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label ?? payload[0]?.payload?.label}</p>
      <p className="font-metric text-lg font-semibold tracking-[-0.02em] text-foreground">
        {value}
        {unit ? <span className="ml-1 text-xs font-semibold text-muted-foreground">{unit}</span> : null}
      </p>
    </div>
  );
}

export function HealthChart({ series, height = 220, color = "hsl(var(--primary))", unit, type = "area", yDomain, showDots = false }: HealthChartProps) {
  const data = series.data.map((d) => ({ name: d.label, value: d.value }));
  const gradientId = `chart-gradient-${useId().replaceAll(":", "")}`;
  const dotProps = showDots ? { r: 4, strokeWidth: 2, fill: "hsl(var(--card))", stroke: color } : { r: 0 };
  const common = {
    data,
    type: "monotone" as const,
    dataKey: "value",
    stroke: color,
    strokeWidth: 2.5,
    dot: dotProps,
    activeDot: { r: 6, strokeWidth: 2.5, fill: "hsl(var(--card))", stroke: color },
  };

  return (
    <div
      className="w-full"
      role="img"
      aria-label={`${unit ?? "Health"} trend chart with ${data.length} data points`}
    >
      <ResponsiveContainer width="100%" height={height}>
        {type === "line" ? (
          <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="2 8" stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "var(--chart-muted)", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "var(--chart-muted)", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              domain={yDomain ?? ["auto", "auto"]}
            />
            <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: "var(--chart-primary)", strokeWidth: 1, strokeDasharray: "3 5", opacity: 0.45 }} />
            <Line {...common} />
          </LineChart>
        ) : (
          <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="60%" stopColor={color} stopOpacity={0.1} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 8" stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "var(--chart-muted)", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "var(--chart-muted)", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              domain={yDomain ?? ["auto", "auto"]}
            />
            <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: "var(--chart-primary)", strokeWidth: 1, strokeDasharray: "3 5", opacity: 0.45 }} />
            <Area {...common} fill={`url(#${gradientId})`} />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-end justify-between gap-3 px-2"
      role="status"
      aria-label="Loading chart data"
      style={{ height }}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ height: 12 }}
          animate={{ height: `${25 + ((i * 37) % 60)}%` }}
          transition={{ duration: 0.8, delay: i * 0.04, ease: "easeOut" }}
          className="flex-1 rounded-full bg-muted/80"
        />
      ))}
    </motion.div>
  );
}
