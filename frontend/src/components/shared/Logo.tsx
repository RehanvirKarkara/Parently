import { cn } from "@/lib/utils";
import logoUrl from "@/assets/logo.png";

export interface LogoProps {
  className?: string;
  markClassName?: string;
  imgClassName?: string;
  size?: "sm" | "md" | "lg" | "xl";
  withText?: boolean;
}

export function Logo({
  className,
  markClassName,
  imgClassName,
  size = "md",
  withText = true,
}: LogoProps) {
  const textSize =
    size === "sm"
      ? "text-lg"
      : size === "lg"
        ? "text-2xl"
        : size === "xl"
          ? "text-3xl"
          : "text-xl";

  const markSize =
    size === "sm"
      ? "h-8 w-8"
      : size === "lg"
        ? "h-11 w-11"
        : size === "xl"
          ? "h-16 w-16"
          : "h-9.5 w-9.5";

  return (
    <div
      className={cn("inline-flex items-center gap-2.5 select-none", className)}
      role="img"
      aria-label="Parently"
    >
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-105",
          markSize,
          markClassName,
        )}
      >
        <img
          src={logoUrl}
          alt="Parently"
          className={cn(
            "h-full w-full object-contain pointer-events-none drop-shadow-[0_2px_8px_rgba(124,58,237,0.18)]",
            imgClassName,
          )}
          loading="eager"
          decoding="async"
        />
      </div>
      {withText && (
        <span
          className={cn(
            "font-heading font-semibold tracking-[-0.03em] text-foreground",
            textSize,
          )}
        >
          Parently
        </span>
      )}
    </div>
  );
}
