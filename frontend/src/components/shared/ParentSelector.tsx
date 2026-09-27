import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import type { Parent } from "@/types";

interface ParentSelectorProps {
  parents: Parent[] | undefined;
  activeId: string;
  onChange: (id: string) => void;
  showActiveDot?: boolean;
  className?: string;
}

/**
 * Shared, accessible parent selector pill-bar.
 * Used by the Dashboard, Health Logs, and Medicines pages.
 */
export function ParentSelector({ parents, activeId, onChange, showActiveDot = true, className }: ParentSelectorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 overflow-x-auto no-scrollbar py-1 max-w-full",
        className,
      )}
      role="group"
      aria-label="Choose a family member"
    >
      {(parents ?? []).map((p) => {
        const active = p.id === activeId;
        return (
          <motion.button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            aria-pressed={active}
            aria-label={`${selectParentAria(p, active)}`}
            className={cn(
              "relative flex min-h-11 items-center gap-2.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-200",
              active
                ? "border-primary/30 bg-primary/8 text-primary shadow-soft-xs ring-1 ring-primary/10"
                : "border-border/70 bg-card/90 text-muted-foreground hover:border-primary/25 hover:bg-card hover:text-foreground hover:shadow-soft-xs",
            )}
            whileTap={{ scale: 0.97 }}
          >
            <PersonAvatar first={p.first_name} last={p.last_name} src={p.avatar_url} color={p.avatar_color} size="sm" />
            {p.first_name}
            {active && showActiveDot && (
              <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary ring-2 ring-card" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

function selectParentAria(p: Parent, active: boolean): string {
  return active ? `Viewing ${p.first_name} ${p.last_name}` : `View ${p.first_name} ${p.last_name}`;
}
