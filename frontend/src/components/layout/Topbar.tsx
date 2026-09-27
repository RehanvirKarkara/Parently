import { AnimatePresence, motion } from "framer-motion";
import { Bell, LogOut, Menu, Settings, UserRound, Sparkles, Moon, Sun } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useThemeStore } from "@/stores/themeStore";
import { greeting } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { Logo } from "@/components/shared/Logo";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useParents } from "@/hooks/queries";

export function Topbar() {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const toggleSidebar = useThemeStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setMode = useAuthStore((s) => s.setMode);
  const setParent = useAuthStore((s) => s.setParent);
  const unread = useNotificationStore((s) => s.unreadCount);
  const location = useLocation();
  const navigate = useNavigate();
  const { data: parents } = useParents();
  const demoParent = parents?.find((p) => p.id === "p-mom");

  return (
    <header className="surface-chrome sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b px-4 pt-[env(safe-area-inset-top)] sm:px-6 lg:px-8">
      {/* Mobile: Logo + page title */}
      {isMobile && (
        <div className="flex min-w-0 items-center gap-2.5">
          <Logo size="sm" withText={false} />
          <span className="truncate font-heading text-sm font-semibold text-foreground">
            {pageTitleFor(location.pathname)}
          </span>
        </div>
      )}

      {/* Desktop: sidebar toggle */}
      {!isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* AI Quick Access (desktop only) */}
      {!isMobile && (
        <Link
          to="/ai"
          className="group flex h-10 items-center gap-2 rounded-xl border border-border/70 bg-card/70 px-3 text-sm text-muted-foreground shadow-soft-xs transition-[color,background-color,border-color,box-shadow] duration-200 hover:border-primary/25 hover:bg-card hover:text-primary hover:shadow-soft"
          aria-label="AI Assistant"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden text-xs font-medium md:block">Ask AI</span>
           <kbd className="hidden rounded-md border border-border/50 bg-background px-1.5 font-metric text-[0.6875rem] text-muted-foreground lg:block">
            ⌘K
          </kbd>
        </Link>
      )}

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        {/* Greeting (desktop only) */}
        <div className="mr-1 hidden text-right xl:block">
          <p className="text-sm font-semibold leading-tight text-foreground">
            {greeting()}, {user?.first_name}
          </p>
          <p className="mt-0.5 text-xs leading-tight text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
        </div>

        {/* Theme toggle button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={useThemeStore.getState().toggleTheme}
          className="flex size-11 items-center justify-center rounded-xl border border-border/70 bg-card/80 text-muted-foreground shadow-soft-xs transition-[color,background-color,border-color,transform] duration-200 hover:border-primary/25 hover:bg-primary/5 hover:text-primary"
          aria-label="Toggle theme"
        >
          <Sun className="h-[17px] w-[17px] hidden dark:block text-warning" />
          <Moon className="h-[17px] w-[17px] block dark:hidden" />
        </motion.button>

        {/* Notifications bell */}
        <Link to="/notifications" className="relative" aria-label="Notifications">
          <motion.div
            className="flex size-11 items-center justify-center rounded-xl border border-border/70 bg-card/80 text-muted-foreground shadow-soft-xs transition-[color,background-color,border-color,transform] duration-200 hover:border-primary/25 hover:bg-primary/5 hover:text-primary"
            whileTap={{ scale: 0.93 }}
          >
            <Bell className="h-[17px] w-[17px]" />
            <AnimatePresence>
              {unread > 0 && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                   className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 font-metric text-[0.6875rem] font-semibold text-primary-foreground shadow-brand"
                >
                  {unread > 99 ? "99+" : unread}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
          {/* Pulse ring for new notifications */}
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-primary" />
          )}
        </Link>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              className="rounded-full transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
              whileTap={{ scale: 0.96 }}
              aria-label="Account menu"
            >
              <PersonAvatar
                first={user?.first_name}
                last={user?.last_name}
                src={user?.avatar_url}
                color="brand"
                className="h-10 w-10 ring-2 ring-primary/15 transition-all hover:ring-primary/30"
              />
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 overflow-hidden p-0">
            {/* Profile header */}
            <div className="border-b border-border/60 bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <PersonAvatar first={user?.first_name} last={user?.last_name} src={user?.avatar_url} color="brand" className="h-11 w-11 ring-2 ring-primary/10" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{user?.first_name} {user?.last_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </div>
            <div className="p-1">
              <DropdownMenuSeparator className="mb-1" />
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                  Settings
                  <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!demoParent}
                  onSelect={() => {
                    if (!demoParent) return;
                    setParent(demoParent);
                    setMode("parent");
                    navigate("/parent");
                  }}
                >
                  <UserRound className="mr-2 h-4 w-4 text-muted-foreground" />
                  Parent view ({demoParent?.first_name ?? "Carol"})
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/8 focus:text-destructive"
                onSelect={() => { logout(); navigate("/login"); }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function pageTitleFor(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/family")) return "Family";
  if (pathname.startsWith("/health-logs")) return "Health Logs";
  if (pathname.startsWith("/medicines")) return "Medicines";
  if (pathname.startsWith("/ai")) return "AI Assistant";
  if (pathname.startsWith("/reports")) return "Reports";
  if (pathname.startsWith("/notifications")) return "Notifications";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/onboarding")) return "Add Parent";
  return "Parently";
}
