import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-xl border p-4 text-sm shadow-soft-xs sm:p-5 [&>svg~*]:pl-8 [&>svg+div]:translate-y-[-2px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:size-5 [&>svg]:text-foreground sm:[&>svg]:left-5 sm:[&>svg]:top-5",
  {
    variants: {
      variant: {
        default: "border-border/70 bg-card text-card-foreground",
        destructive: "border-destructive/25 bg-destructive/8 text-destructive [&>svg]:text-destructive",
        warning: "border-warning/25 bg-warning/10 text-warning-foreground [&>svg]:text-warning",
        success: "border-secondary/25 bg-secondary/8 text-secondary [&>svg]:text-secondary",
        info: "border-info/25 bg-info/8 text-info [&>svg]:text-info",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h4 ref={ref} className={cn("mb-1 font-heading text-sm font-semibold leading-5 tracking-[-0.01em]", className)} {...props} />
  ),
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm leading-relaxed opacity-85 [&_p]:leading-relaxed", className)} {...props} />
  ),
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
