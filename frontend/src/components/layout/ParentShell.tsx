import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, ClipboardCheck, HeartPulse, Home, Sparkles, type LucideIcon } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useParent } from "@/hooks/queries";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { Button } from "@/components/ui/button";

const parentNav: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/parent", label: "Home", icon: Home },
  { to: "/parent/check-ins", label: "Check-ins", icon: ClipboardCheck },
  { to: "/parent/ai", label: "Health Coach", icon: Sparkles },
  { to: "/parent/legacy", label: "Legacy", icon: BookOpen },
  { to: "/parent/health", label: "My Health", icon: HeartPulse },
];

export function ParentShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const parentId = useAuthStore((s) => s.parentId);
  const setMode = useAuthStore((s) => s.setMode);
  const { data: parent } = useParent(parentId ?? "p-mom");

  useEffect(() => {
    const frame = requestAnimationFrame(() => document.getElementById("main-content")?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);

  return (
    <div className="flex min-h-dvh flex-col bg-background bg-mesh-primary">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-soft-lg transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <header className="surface-chrome sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b px-4 pt-[env(safe-area-inset-top)] sm:px-6">
        <Logo size="sm" />
        <p className="hidden min-w-0 flex-1 truncate text-right font-heading text-sm font-semibold text-foreground sm:block">
          {parent ? `${parent.first_name}'s Space` : "Parently"}
        </p>

        <nav className="ml-2 hidden items-center gap-1 rounded-xl border border-border/60 bg-background/55 p-1 lg:flex" aria-label="Parent navigation">
          {parentNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/parent"}
              className={({ isActive }) =>
                cn(
                  "flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
                  isActive
                    ? "bg-primary/10 text-primary shadow-soft-xs"
                    : "text-muted-foreground hover:bg-card hover:text-foreground",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-2 sm:ml-0">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setMode("offspring");
              navigate("/");
            }}
            aria-label="Back to family view"
            className="sm:hidden"
          >
            <ArrowLeft />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMode("offspring");
              navigate("/");
            }}
            className="hidden sm:inline-flex"
          >
            <ArrowLeft />
            Back to family view
          </Button>
          <PersonAvatar
            first={parent?.first_name}
            last={parent?.last_name}
            src={parent?.avatar_url}
            color={parent?.avatar_color}
            className="h-9 w-9 ring-2 ring-primary/15"
          />
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-6 pb-28 outline-none sm:px-6 sm:py-8 lg:px-8 lg:pb-10"
      >
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>

      <nav
        className="fixed bottom-5 inset-x-0 z-40 mx-auto flex justify-center pointer-events-none px-4 pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Parent navigation"
      >
        <div className="relative w-full max-w-[440px] flex justify-center">
          <div
            className="absolute -inset-1 -z-10 rounded-full bg-gradient-to-r from-primary/20 via-secondary-accent/25 to-primary/20 blur-xl opacity-60 pointer-events-none dark:opacity-40"
            aria-hidden="true"
          />

          <div
            className={cn(
              "pointer-events-auto relative flex w-full items-center justify-between gap-1 p-1.5 sm:p-2",
              "rounded-full bg-card/85 dark:bg-slate-900/85 backdrop-blur-2xl",
              "border border-white/60 dark:border-white/10",
              "shadow-[0_20px_44px_-10px_rgba(15,23,42,0.16),0_8px_24px_-4px_rgba(124,58,237,0.14),inset_0_1px_1px_rgba(255,255,255,0.9)]",
              "dark:shadow-[0_20px_44px_-10px_rgba(0,0,0,0.6),0_8px_24px_-4px_rgba(124,58,237,0.25),inset_0_1px_1px_rgba(255,255,255,0.08)]",
            )}
          >
            {parentNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/parent"}
                className="group relative flex-1 min-w-0 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              >
                {({ isActive }) => (
                  <motion.div
                    whileTap={{ scale: 0.92 }}
                    className={cn(
                      "relative flex h-[54px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-full px-2 py-1 select-none transition-colors duration-200",
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="parent-floating-active-pill"
                        className={cn(
                          "absolute inset-0 rounded-full -z-0",
                          "bg-gradient-to-b from-primary/14 via-primary/10 to-primary/18 dark:from-primary/25 dark:to-primary/15",
                          "border border-primary/20 dark:border-primary/30",
                          "shadow-[0_2px_12px_rgba(124,58,237,0.12)]",
                        )}
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 32,
                          mass: 0.8,
                        }}
                      />
                    )}

                    <motion.div
                      animate={
                        isActive
                          ? { scale: 1.1, y: -1 }
                          : { scale: 1, y: 0 }
                      }
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 26,
                      }}
                      className="relative z-10 flex items-center justify-center"
                    >
                      <item.icon
                        className={cn(
                          "h-[19px] w-[19px] transition-all duration-200",
                          isActive
                            ? "text-primary drop-shadow-[0_2px_8px_rgba(124,58,237,0.35)]"
                            : "text-muted-foreground group-hover:text-foreground",
                        )}
                        strokeWidth={isActive ? 2.3 : 1.9}
                      />
                    </motion.div>

                    <span
                      className={cn(
                        "relative z-10 truncate text-[11px] leading-tight transition-colors duration-200",
                        isActive
                          ? "font-semibold text-primary drop-shadow-[0_1px_2px_rgba(124,58,237,0.15)]"
                          : "font-medium text-muted-foreground group-hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </span>
                  </motion.div>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
