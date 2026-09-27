import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AIThinkingIndicatorProps {
  stages?: string[];
  className?: string;
  intervalMs?: number;
}

const defaultStages = [
  "Analyzing health records & check-ins…",
  "Spotting subtle vitality trends…",
  "Synthesizing personalized family care insights…",
];

export function AIThinkingIndicator({
  stages = defaultStages,
  className,
  intervalMs = 2600,
}: AIThinkingIndicatorProps) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (stages.length <= 1) return;
    const timer = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % stages.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [stages.length, intervalMs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25 }}
      className={cn("flex items-center gap-3", className)}
      role="status"
      aria-live="polite"
    >
      {/* Glowing AI Avatar icon */}
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
        <Sparkles className="h-4 w-4 animate-pulse text-primary" />
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
        </span>
      </div>

      {/* Status Container */}
      <div className="flex items-center gap-3 rounded-2xl rounded-tl-sm border border-border/70 bg-card/90 px-4 py-2.5 shadow-soft-xs backdrop-blur-md">
        {/* Animated 3-dot waveform */}
        <div className="flex items-center gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
              className="h-1.5 w-1.5 rounded-full bg-primary"
            />
          ))}
        </div>

        {/* Dynamic Status Text */}
        <AnimatePresence mode="wait">
          <motion.span
            key={stages[stageIndex]}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.2 }}
            className="text-xs font-semibold text-muted-foreground"
          >
            {stages[stageIndex]}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
