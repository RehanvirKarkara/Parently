import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Heart,
  LayoutDashboard,
  LogOut,
  Pill,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notificationStore";
import { useThemeStore } from "@/stores/themeStore";
import { useAuthStore } from "@/stores/authStore";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/calendar", label: "Care Calendar", icon: Calendar },
  { to: "/family", label: "Family", icon: Heart },
  { to: "/health-logs", label: "Health Logs", icon: Activity },
  { to: "/medicines", label: "Medicines", icon: Pill },
  { to: "/ai", label: "AI Assistant", icon: Sparkles },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

const bottomNav = [
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
];

interface NavItemProps {
  to: string;
  label: string;
  icon: LucideIcon;
  collapsed: boolean;
  end?: boolean;
  badge?: number;
}

function NavItem({ to, label, icon: Icon, collapsed, end, badge }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      aria-label={label}
      aria-current={end ? "page" : undefined}
      className="group relative block rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
    >
      {({ isActive }) => (
        <motion.div
          initial={false}
          whileHover={{ x: collapsed ? 0 : 2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 450, damping: 28 }}
          className={cn(
            "relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-200",
            collapsed && "justify-center px-0",
            isActive
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {/* Smooth animated sliding pill background */}
          {isActive && (
            <motion.div
              layoutId="sidebar-active-tab-pill"
              className={cn(
                "absolute inset-0 rounded-xl",
                "bg-gradient-to-r from-primary/12 via-primary/8 to-secondary-accent/8 dark:from-primary/22 dark:via-primary/12 dark:to-transparent",
                "border border-primary/20 dark:border-primary/30",
                "shadow-[0_2px_12px_rgba(124,58,237,0.08)]",
              )}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 32,
                mass: 0.8,
              }}
            >
              {/* Subtle vertical accent glow bar on left */}
              {!collapsed && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3.5px] rounded-r-full bg-primary shadow-[0_0_10px_rgba(124,58,237,0.7)]"
                  aria-hidden="true"
                />
              )}
            </motion.div>
          )}

          {/* Icon container */}
          <motion.div
            animate={isActive ? { scale: 1.05 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 450, damping: 26 }}
            className={cn(
              "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
              isActive
                ? "bg-primary/12 text-primary ring-1 ring-primary/25 shadow-sm"
                : "text-muted-foreground group-hover:bg-muted/70 group-hover:text-foreground",
            )}
          >
            <Icon
              className={cn(
                "h-[18px] w-[18px] transition-all duration-200",
                isActive && "drop-shadow-[0_2px_8px_rgba(124,58,237,0.35)]",
              )}
              strokeWidth={isActive ? 2.3 : 2}
            />

            {/* Notification badge on icon */}
            {badge && badge > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 font-metric text-[9px] font-bold text-white shadow-[0_2px_6px_rgba(240,68,56,0.35)] ring-2 ring-card">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </motion.div>

          {/* Label */}
          {!collapsed && (
            <span
              className={cn(
                "relative z-10 truncate transition-colors duration-200",
                isActive ? "font-semibold text-primary" : "text-muted-foreground group-hover:text-foreground",
              )}
            >
              {label}
            </span>
          )}

          {/* Badge count next to label */}
          {!collapsed && badge && badge > 0 && (
            <span className="relative z-10 ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/12 px-1.5 font-metric text-[0.6875rem] font-semibold text-primary ring-1 ring-primary/20">
              {badge > 99 ? "99+" : badge}
            </span>
          )}

          {/* Tooltip for collapsed state */}
          {collapsed && (
            <span
              role="tooltip"
              className="surface-overlay pointer-events-none absolute left-[58px] z-50 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground opacity-0 shadow-soft transition-all duration-150 group-hover:opacity-100 group-focus:opacity-100 group-hover:translate-x-1"
            >
              {label}
            </span>
          )}
        </motion.div>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const collapsed = useThemeStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useThemeStore((s) => s.toggleSidebar);
  const unread = useNotificationStore((s) => s.unreadCount);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 264 }}
      transition={{ type: "spring", stiffness: 340, damping: 32 }}
      className="surface-chrome sticky top-0 hidden h-dvh shrink-0 flex-col border-r pt-[env(safe-area-inset-top)] lg:flex backdrop-blur-xl"
      style={{ overflow: "visible" }}
    >
      {/* Logo header */}
      <div
        className={cn(
          "flex min-h-16 items-center border-b border-border/60 transition-all duration-300",
          collapsed ? "justify-center px-2" : "px-5",
        )}
      >
        <Logo size="sm" withText={!collapsed} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        {nav.map((item) => (
          <NavItem key={item.to} {...item} collapsed={collapsed} />
        ))}

        <div className={cn("my-3", collapsed ? "mx-auto h-px w-8" : "mx-1 h-px", "bg-border/60")} />

        {bottomNav.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            collapsed={collapsed}
            badge={item.to === "/notifications" ? unread : undefined}
          />
        ))}
      </nav>

      {/* User profile footer */}
      <div className={cn("border-t border-border/50 p-3", collapsed && "flex flex-col items-center gap-2")}>
        {/* Collapse toggle */}
        <motion.button
          onClick={toggleSidebar}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "mb-2 flex items-center justify-center rounded-xl border border-border/70 bg-background/50 text-muted-foreground transition-all duration-200 hover:border-primary/25 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 shadow-soft-xs",
            collapsed ? "size-10" : "h-10 w-full gap-2 px-3 text-xs font-semibold",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Collapse sidebar</span>
            </>
          )}
        </motion.button>

        {/* User profile card */}
        <motion.div
          className={cn(
            "flex items-center gap-2.5 rounded-xl border border-border/60 bg-background/45 p-2.5 shadow-soft-xs backdrop-blur-sm",
            collapsed && "justify-center",
          )}
          whileHover={{ scale: 1.01 }}
        >
          <PersonAvatar
            first={user?.first_name}
            last={user?.last_name}
            src={user?.avatar_url}
            color="brand"
            className="h-9 w-9 shrink-0 ring-2 ring-primary/20 shadow-sm"
          />
          {!collapsed && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="min-w-0 flex-1"
              >
                <p className="truncate text-xs font-semibold text-foreground">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="truncate text-[0.6875rem] text-muted-foreground">{user?.email}</p>
              </motion.div>
            </AnimatePresence>
          )}
          {!collapsed && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-destructive/15"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </motion.button>
          )}
        </motion.div>
      </div>
    </motion.aside>
  );
}
