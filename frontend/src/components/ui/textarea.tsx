import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[96px] w-full resize-y rounded-xl border border-input bg-background/80 px-3.5 py-3 text-[0.9375rem] leading-6 text-foreground shadow-soft-xs transition-[color,background-color,border-color,box-shadow] duration-200 ease-out placeholder:text-muted-foreground/70 hover:border-primary/30 hover:bg-background focus-visible:border-primary/60 focus-visible:bg-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-55 aria-[invalid=true]:border-destructive/60 aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-destructive/10",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Textarea };
