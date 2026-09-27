import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.02 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

/**
 * Premium page header with eyebrow pill badge, display-level title, and staggered reveal animation.
 */
export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={cn("mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6", className)}
    >
      <div className="min-w-0">
        {eyebrow && (
          <motion.div variants={itemVariants} className="mb-3 inline-flex items-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.09em] text-primary ring-1 ring-inset ring-primary/10">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {eyebrow}
            </span>
          </motion.div>
        )}
        <motion.h1
          variants={itemVariants}
          className="font-heading text-[1.75rem] font-semibold leading-tight text-foreground sm:text-[2rem]"
        >
          {title}
        </motion.h1>
        {description && (
          <motion.p
            variants={itemVariants}
            className="mt-2 max-w-2xl text-[0.9375rem] leading-6 text-muted-foreground text-pretty"
          >
            {description}
          </motion.p>
        )}
      </div>
      {actions && (
        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
          {actions}
        </motion.div>
      )}
    </motion.div>
  );
}
