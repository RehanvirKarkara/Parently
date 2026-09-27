import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-input bg-background/80 px-3.5 py-2.5 text-[0.9375rem] leading-5 text-foreground shadow-soft-xs transition-[color,background-color,border-color,box-shadow] duration-200 ease-out",
          "placeholder:text-muted-foreground/70",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "hover:border-primary/30 hover:bg-background",
          "focus-visible:border-primary/60 focus-visible:bg-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10",
          "disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-55",
          "aria-[invalid=true]:border-destructive/60 aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-destructive/10",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
