import { apiRequest, mockDelay, USE_MOCK } from "@/api/client";
import { mockDb } from "@/api/mockDb";
import type { AppNotification, Report } from "@/types";

export async function getNotifications(): Promise<AppNotification[]> {
  if (USE_MOCK) {
    await mockDelay(280);
    return [...mockDb.notifications].sort((a, b) => b.sent_at.localeCompare(a.sent_at));
  }
  return apiRequest<AppNotification[]>("/notifications");
}

export async function markNotificationRead(id: string): Promise<{ success: boolean }> {
  if (USE_MOCK) {
    await mockDelay(120);
    const n = mockDb.notifications.find((n) => n.id === id);
    if (n) n.is_read = true;
    return { success: true };
  }
  return apiRequest("/notifications/" + id + "/read", { method: "POST" });
}

export async function markAllNotificationsRead(): Promise<{ success: boolean }> {
  if (USE_MOCK) {
    await mockDelay(200);
    mockDb.notifications.forEach((n) => (n.is_read = true));
    return { success: true };
  }
  return apiRequest("/notifications/read-all", { method: "POST" });
}

export async function getReports(): Promise<Report[]> {
  if (USE_MOCK) {
    await mockDelay(280);
    return [...mockDb.reports].sort((a, b) => b.generated_at.localeCompare(a.generated_at));
  }
  return apiRequest<Report[]>("/reports");
}

export async function getReport(id: string): Promise<Report> {
  if (USE_MOCK) {
    await mockDelay(200);
    const report = mockDb.reports.find((r) => r.id === id);
    if (!report) throw new Error("Report not found.");
    return report;
  }
  return apiRequest<Report>(`/reports/${id}`);
}

export async function generateReport(report_type: "weekly" | "monthly"): Promise<Report> {
  if (USE_MOCK) {
    await mockDelay(1600);
    const report: Report = {
      id: `rep-${Date.now().toString(36)}`,
      family_id: mockDb.family.id,
      report_type,
      report_period_start: new Date(Date.now() - (report_type === "weekly" ? 7 : 30) * 86400000).toISOString().slice(0, 10),
      report_period_end: new Date().toISOString().slice(0, 10),
      content:
        `Generated ${report_type} report. Both parents maintained strong check-in consistency and medicine adherence. ` +
        `Carol's average day rating improved slightly. Robert's evening activity picked up toward the end of the period. ` +
        `No risk patterns detected.`,
      generated_at: new Date().toISOString(),
    };
    mockDb.reports.unshift(report);
    return report;
  }
  return apiRequest<Report>("/reports/generate", { method: "POST", body: { report_type } });
}
