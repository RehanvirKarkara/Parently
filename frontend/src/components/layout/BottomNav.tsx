import { motion } from "framer-motion";
import {
  Bell,
  Heart,
  HeartPulse,
  Home,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notificationStore";

interface NavTab {
  id: string;
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  matches?: string[];
  hasBadge?: boolean;
}

const tabs: NavTab[] = [
  {
    id: "home",
    to: "/",
    label: "Home",
    icon: Home,
    end: true,
  },
  {
    id: "health",
    to: "/health-logs",
    label: "Health",
    icon: HeartPulse,
    matches: ["/health-logs", "/medicines", "/reports"],
  },
  {
    id: "care",
    to: "/family",
    label: "Care",
    icon: Heart,
    matches: ["/calendar", "/family", "/ai"],
  },
  {
    id: "notifications",
    to: "/notifications",
    label: "Alerts",
    icon: Bell,
    hasBadge: true,
  },
  {
    id: "profile",
    to: "/settings",
    label: "Profile",
    icon: UserRound,
  },
];

export function BottomNav() {
  const location = useLocation();
  const unread = useNotificationStore((s) => s.unreadCount);

  const isTabActive = (tab: NavTab) => {
    if (tab.end) {
      return location.pathname === tab.to;
    }
    if (location.pathname === tab.to || location.pathname.startsWith(tab.to + "/")) {
      return true;
    }
    if (tab.matches?.some((m) => location.pathname === m || location.pathname.startsWith(m + "/"))) {
      return true;
    }
    return false;
  };

  return (
    <nav
      className="fixed bottom-5 inset-x-0 z-40 mx-auto flex justify-center pointer-events-none px-4 pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Bottom navigation"
    >
      {/* Outer ambient glow */}
      <div className="relative w-full max-w-[440px] flex justify-center">
        <div
          className="absolute -inset-1 -z-10 rounded-full bg-gradient-to-r from-primary/20 via-secondary-accent/25 to-primary/20 blur-xl opacity-60 pointer-events-none dark:opacity-40"
          aria-hidden="true"
        />

        {/* Floating Glass Container */}
        <div
          className={cn(
            "pointer-events-auto relative flex w-full items-center justify-between gap-1 p-1.5 sm:p-2",
            "rounded-full bg-card/85 dark:bg-slate-900/85 backdrop-blur-2xl",
            "border border-white/60 dark:border-white/10",
            "shadow-[0_20px_44px_-10px_rgba(15,23,42,0.16),0_8px_24px_-4px_rgba(124,58,237,0.14),inset_0_1px_1px_rgba(255,255,255,0.9)]",
            "dark:shadow-[0_20px_44px_-10px_rgba(0,0,0,0.6),0_8px_24px_-4px_rgba(124,58,237,0.25),inset_0_1px_1px_rgba(255,255,255,0.08)]",
          )}
        >
          {tabs.map((tab) => {
            const active = isTabActive(tab);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.id}
                to={tab.to}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
                className="group relative flex-1 min-w-0 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              >
                <motion.div
                  whileTap={{ scale: 0.92 }}
                  className={cn(
                    "relative flex h-[54px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-full px-2 py-1 select-none transition-colors duration-200",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {/* Fluid sliding pill background */}
                  {active && (
                    <motion.div
                      layoutId="floating-bottom-active-pill"
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

                  {/* Icon with subtle scale and gentle glow */}
                  <motion.div
                    animate={
                      active
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
                    <Icon
                      className={cn(
                        "h-[19px] w-[19px] transition-all duration-200",
                        active
                          ? "text-primary drop-shadow-[0_2px_8px_rgba(124,58,237,0.35)]"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                      strokeWidth={active ? 2.3 : 1.9}
                    />

                    {/* Elegant Notification Badge/Dot */}
                    {tab.hasBadge && unread > 0 && (
                      <span className="absolute -top-1 -right-2 flex items-center justify-center">
                        <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-accent opacity-50" />
                        <span className="relative flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-accent px-1 font-metric text-[9px] font-bold text-white shadow-[0_2px_6px_rgba(240,68,56,0.4)] ring-2 ring-card">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      </span>
                    )}
                  </motion.div>

                  {/* Label */}
                  <span
                    className={cn(
                      "relative z-10 truncate text-[11px] leading-tight transition-colors duration-200",
                      active
                        ? "font-semibold text-primary drop-shadow-[0_1px_2px_rgba(124,58,237,0.15)]"
                        : "font-medium text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {tab.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
