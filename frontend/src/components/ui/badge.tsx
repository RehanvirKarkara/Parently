import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex min-h-6 items-center gap-1 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold leading-none tracking-[0.01em] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary ring-1 ring-inset ring-primary/15",
        secondary: "bg-secondary/10 text-secondary ring-1 ring-inset ring-secondary/15",
        mint: "bg-secondary/10 text-secondary ring-1 ring-inset ring-secondary/15",
        accent: "bg-accent/10 text-accent ring-1 ring-inset ring-accent/15",
        coral: "bg-accent/10 text-accent ring-1 ring-inset ring-accent/15",
        success: "bg-secondary/10 text-secondary ring-1 ring-inset ring-secondary/15",
        warning: "bg-warning/12 text-warning-foreground ring-1 ring-inset ring-warning/20",
        destructive: "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/15",
        outline: "border border-border bg-background/40 text-muted-foreground",
        muted: "bg-muted text-muted-foreground",
        solid: "bg-primary text-primary-foreground shadow-brand",
        premium: "bg-gradient-hero text-white shadow-brand",
        info: "bg-info/10 text-info ring-1 ring-inset ring-info/15",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
