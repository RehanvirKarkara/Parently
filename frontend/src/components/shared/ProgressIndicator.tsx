import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface StepItem {
  id?: string;
  label: string;
  sublabel?: string;
  description?: string;
}

interface ProgressIndicatorProps {
  steps: StepItem[];
  currentStepIndex: number;
  className?: string;
  onStepClick?: (index: number) => void;
  allowNavigateBackOnly?: boolean;
}

export function ProgressIndicator({
  steps,
  currentStepIndex,
  className,
  onStepClick,
  allowNavigateBackOnly = true,
}: ProgressIndicatorProps) {
  const total = steps.length;
  const progressPercent = Math.round((currentStepIndex / Math.max(1, total - 1)) * 100);

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile view: Compact summary with progress bar */}
      <div className="flex flex-col gap-1.5 sm:hidden mb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-primary">
            Step {currentStepIndex + 1} of {total}:
          </span>
          <span className="font-medium text-foreground">
            {steps[currentStepIndex]?.label}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted/80 overflow-hidden">
          <motion.div
            initial={false}
            animate={{ width: `${((currentStepIndex + 1) / total) * 100}%` }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full bg-gradient-primary"
          />
        </div>
      </div>

      {/* Desktop / Tablet view: Full step-by-step pipeline */}
      <div className="hidden sm:block">
        <div className="relative flex items-center justify-between">
          {/* Background Connecting Line */}
          <div className="absolute left-6 right-6 top-4 -translate-y-1/2 h-1 bg-muted/80 rounded-full -z-0" />

          {/* Active Connecting Fill Line */}
          <div className="absolute left-6 right-6 top-4 -translate-y-1/2 h-1 -z-0">
            <motion.div
              initial={false}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-gradient-primary rounded-full"
            />
          </div>

          {/* Step Nodes */}
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isFuture = idx > currentStepIndex;

            const isClickable =
              Boolean(onStepClick) && (allowNavigateBackOnly ? idx <= currentStepIndex : true);

            return (
              <div
                key={step.id ?? step.label ?? idx}
                className="relative z-10 flex flex-col items-center group/step"
              >
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick?.(idx)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                    isClickable ? "cursor-pointer" : "cursor-default",
                    isCompleted &&
                      "bg-primary text-primary-foreground shadow-brand-sm hover:scale-105 ring-2 ring-primary/20",
                    isCurrent &&
                      "bg-card text-primary border-2 border-primary shadow-brand ring-4 ring-primary/15 scale-110",
                    isFuture &&
                      "bg-card text-muted-foreground border-2 border-border/80",
                    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 stroke-[2.5]" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </button>

                <div className="mt-2 text-center select-none">
                  <p
                    className={cn(
                      "text-xs font-semibold tracking-[-0.01em] transition-colors",
                      isCurrent
                        ? "text-primary"
                        : isCompleted
                          ? "text-foreground"
                          : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </p>
                  {(step.sublabel || step.description) && (
                    <p className="text-[10px] text-muted-foreground/75 hidden md:block">
                      {step.sublabel || step.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
