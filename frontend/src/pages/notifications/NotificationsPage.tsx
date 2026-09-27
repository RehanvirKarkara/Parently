import { motion } from "framer-motion";
import { AlertTriangle, Bell, CalendarClock, CheckCheck, FileText, Gamepad2, Heart, Pill, Sparkles } from "lucide-react";
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from "@/hooks/queries";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { NotificationsSkeleton } from "@/components/shared/RichSkeletons";
import { cn, relativeTime } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/types";

const typeMeta: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  missed_checkin_child: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10 ring-1 ring-destructive/20" },
  missed_checkin_parent: { icon: CalendarClock, color: "text-warning-foreground", bg: "bg-warning/10 ring-1 ring-warning/20" },
  medicine_reminder: { icon: Pill, color: "text-secondary", bg: "bg-secondary/10 ring-1 ring-secondary/20" },
  checkin_reminder: { icon: CalendarClock, color: "text-primary", bg: "bg-primary/10 ring-1 ring-primary/20" },
  report_ready: { icon: FileText, color: "text-primary", bg: "bg-primary/10 ring-1 ring-primary/20" },
  legacy_shared: { icon: Sparkles, color: "text-accent", bg: "bg-accent/12 ring-1 ring-accent/20" },
  parent_alert: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10 ring-1 ring-destructive/20" },
  family_activity: { icon: Heart, color: "text-accent", bg: "bg-accent/12 ring-1 ring-accent/20" },
  quiz_invite: { icon: Gamepad2, color: "text-warning-foreground", bg: "bg-warning/10 ring-1 ring-warning/20" },
};

export function NotificationsPage() {
  const { data: notifications, isLoading, isError, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleMarkRead = (n: AppNotification) => {
    if (!n.is_read) {
      markRead.mutate(n.id);
    }
  };

  const grouped = (notifications ?? []).reduce<Record<string, AppNotification[]>>((acc, n) => {
    const day = new Date(n.sent_at).toDateString();
    (acc[day] ??= []).push(n);
    return acc;
  }, {});

  const unread = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Updates"
        title="Notifications"
        description="Alerts, reminders, and family moments — all in one place."
        actions={
          <Button
            variant="outline"
            onClick={() => markAllRead.mutate(undefined)}
            disabled={unread === 0}
            isLoading={markAllRead.isPending}
            loadingText="Marking all read…"
          >
            <CheckCheck className="h-4 w-4 text-primary" />
            Mark all as read
          </Button>
        }
      />

      {isLoading ? (
        <NotificationsSkeleton />
      ) : isError ? (
        <ErrorState title="Notifications are unavailable" onRetry={() => void refetch()} />
      ) : notifications?.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="New alerts and family updates will appear here."
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([day, items]) => (
            <div key={day}>
               <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {new Date(day).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
              <div className="space-y-2.5">
                {items.map((n, i) => {
                  const meta = typeMeta[n.type] ?? typeMeta.family_activity;
                  const Icon = meta.icon;
                  return (
                    <motion.button
                      key={n.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -1 }}
                      onClick={() => handleMarkRead(n)}
                      className={cn(
                         "group flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-[border-color,background-color,box-shadow,transform] sm:gap-4 sm:p-5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 motion-reduce:transform-none",
                         n.is_read ? "border-border/60 bg-card/55 hover:border-border" : "border-primary/20 bg-card/90 shadow-soft-xs ring-1 ring-primary/10",
                      )}
                    >
                       <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", meta.bg)}>
                        <Icon className={cn("h-5 w-5", meta.color)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                           <p className="text-sm font-semibold text-foreground">{n.title ?? n.message}</p>
                           {!n.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary"><span className="sr-only">Unread</span></span>}
                        </div>
                        <p className={cn("mt-0.5 text-xs leading-relaxed", n.is_read ? "text-muted-foreground" : "text-foreground/85 font-medium")}>{n.message}</p>
                      </div>
                       <span className="hidden shrink-0 text-xs font-medium text-muted-foreground sm:block">{relativeTime(n.sent_at)}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
