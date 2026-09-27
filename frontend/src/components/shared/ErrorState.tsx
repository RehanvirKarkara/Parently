import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "We couldn't load this",
  description = "Your data is safe. Try again in a moment.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex min-h-64 flex-col items-center justify-center rounded-[1.5rem] border border-destructive/15 bg-destructive/5 px-6 py-12 text-center ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/10">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h2 className="mt-5 font-heading text-lg font-semibold tracking-[-0.02em] text-foreground">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      {onRetry && (
        <Button type="button" variant="outline" onClick={onRetry} className="mt-6">
          <RefreshCw /> Try again
        </Button>
      )}
    </div>
  );
}
