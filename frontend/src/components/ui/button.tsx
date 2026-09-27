import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold tracking-[-0.01em] transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none motion-reduce:transform-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "rounded-xl bg-primary text-primary-foreground shadow-brand hover:-translate-y-px hover:bg-primary-hover hover:shadow-brand-md active:translate-y-0",
        gradient:
          "rounded-xl bg-gradient-hero text-white shadow-brand hover:-translate-y-px hover:brightness-[1.04] hover:shadow-brand-lg active:translate-y-0",
        secondary:
          "rounded-xl bg-secondary text-secondary-foreground shadow-mint hover:-translate-y-px hover:brightness-[1.04] active:translate-y-0",
        accent:
          "rounded-xl bg-accent text-accent-foreground shadow-coral hover:-translate-y-px hover:brightness-[1.04] active:translate-y-0",
        outline:
          "rounded-xl border border-border bg-card/85 text-foreground shadow-soft-xs hover:border-primary/30 hover:bg-card hover:shadow-soft",
        ghost:
          "rounded-xl text-foreground hover:bg-muted/70 hover:text-foreground",
        glass:
          "glass rounded-xl text-foreground shadow-soft hover:bg-card/90",
        danger:
          "rounded-xl bg-destructive text-destructive-foreground shadow-soft hover:-translate-y-px hover:bg-destructive/90 active:translate-y-0",
        success:
          "rounded-xl bg-secondary text-secondary-foreground shadow-mint hover:-translate-y-px hover:brightness-[1.04] active:translate-y-0",
        link: "h-auto rounded-none px-0 text-primary underline-offset-4 hover:underline",
        "ghost-primary":
          "rounded-xl text-primary hover:bg-primary/8 hover:text-primary",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-10 rounded-lg px-4 text-xs",
        lg: "h-12 px-6 text-[15px]",
        xl: "h-14 px-7 text-base rounded-2xl",
        icon: "size-11",
        "icon-sm": "size-10 rounded-lg",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      loadingText,
      icon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading ? "true" : undefined}
        className={cn(
          buttonVariants({ variant, size, className }),
          isLoading && "cursor-wait",
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {icon && <span className="shrink-0">{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
