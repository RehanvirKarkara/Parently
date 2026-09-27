import { motion, type Variants } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

/**
 * Premium empty state with animated icon, staggered text reveal, and optional action.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizeConfig = {
    sm: { wrapper: "py-10", iconBox: "h-14 w-14", icon: "h-6 w-6", title: "text-base", desc: "text-xs" },
    md: { wrapper: "py-14", iconBox: "h-16 w-16", icon: "h-7 w-7", title: "text-lg", desc: "text-sm" },
    lg: { wrapper: "py-18", iconBox: "h-20 w-20", icon: "h-8 w-8", title: "text-xl", desc: "text-base" },
  }[size];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={cn("flex flex-col items-center text-center", sizeConfig.wrapper, className)}
    >
      {/* Animated icon with floating orb background */}
      <motion.div variants={itemVariants} className="relative mb-5">
        {/* Outer glow ring */}
        <div className="absolute -inset-2 rounded-[1.75rem] bg-primary/5" />
        {/* Icon container */}
        <motion.div
          className={cn(
            "relative flex items-center justify-center rounded-2xl bg-primary/8 ring-1 ring-inset ring-primary/10",
            sizeConfig.iconBox,
          )}
        >
          <Icon className={cn("text-primary", sizeConfig.icon)} strokeWidth={1.8} />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h3
        variants={itemVariants}
        className={cn("font-heading font-semibold tracking-[-0.025em] text-foreground", sizeConfig.title)}
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          variants={itemVariants}
          className={cn("mt-2 max-w-sm leading-relaxed text-muted-foreground", sizeConfig.desc)}
        >
          {description}
        </motion.p>
      )}

      {/* Action button */}
      {actionLabel && onAction && (
        <motion.div variants={itemVariants} className="mt-6">
          <Button onClick={onAction}>
            {actionLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
