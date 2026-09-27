import { Toaster as SonnerToaster } from "sonner";
import { cn } from "@/lib/utils";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        classNames: {
          toast: cn(
            "!rounded-2xl !border-border/70 !bg-popover/95 !text-foreground !shadow-soft-xl",
            "!font-sans !text-sm !backdrop-blur-xl",
          ),
          title: "!font-heading !font-semibold",
          description: "!text-muted-foreground",
          success: "!border-secondary/30",
          error: "!border-destructive/30",
        },
        style: {
          background: "hsl(var(--popover) / 0.96)",
          border: "1px solid hsl(var(--border))",
          backdropFilter: "blur(24px) saturate(160%)",
        },
      }}
      richColors={false}
      closeButton
      theme="system"
    />
  );
}
