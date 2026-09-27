import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authApi from "@/api/auth";
import * as engagementApi from "@/api/engagement";
import * as familiesApi from "@/api/families";
import * as healthApi from "@/api/health";
import * as reportsApi from "@/api/reports";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/api/reports";
import { sendMessage, getConversation } from "@/api/ai";
import type { AppNotification } from "@/types";

const q = {
  family: ["family"] as const,
  familyMembers: ["family-members"] as const,
  parents: ["parents"] as const,
  parent: (id: string) => ["parent", id] as const,
  healthLogs: (parentId?: string) => ["health-logs", parentId ?? "all"] as const,
  medicines: (parentId?: string) => ["medicines", parentId ?? "all"] as const,
  reports: ["reports"] as const,
  notifications: ["notifications"] as const,
  quizQuestions: ["quiz-questions"] as const,
  quizAnswers: ["quiz-answers"] as const,
  legacyQuestions: ["legacy-questions"] as const,
  legacyAnswers: ["legacy-answers"] as const,
  conversation: (t: string) => ["conversation", t] as const,
};

export const queryKeys = q;

/* ---------- Family ---------- */

export function useFamily() {
  return useQuery({ queryKey: q.family, queryFn: () => familiesApi.getMyFamily() });
}

export function useFamilyMembers() {
  return useQuery({ queryKey: q.familyMembers, queryFn: () => familiesApi.getFamilyMembers() });
}

export function useParents() {
  return useQuery({ queryKey: q.parents, queryFn: () => familiesApi.getParents() });
}

export function useParent(id: string | undefined) {
  return useQuery({
    queryKey: q.parent(id ?? ""),
    queryFn: () => familiesApi.getParent(id as string),
    enabled: Boolean(id),
  });
}

export function useInviteParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: familiesApi.ParentInvitePayload) => familiesApi.inviteParent(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: q.parents });
    },
  });
}

export function useAcceptParentInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: familiesApi.AcceptInvitePayload) => familiesApi.acceptParentInvite(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: q.parents });
    },
  });
}

export function useInviteSibling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => familiesApi.inviteSibling(email),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: q.familyMembers });
    },
  });
}

export function useResendParentInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (parentId: string) => familiesApi.resendParentInvite(parentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: q.parents }),
  });
}

/* ---------- Health ---------- */

export function useHealthLogs(parentId?: string) {
  return useQuery({ queryKey: q.healthLogs(parentId), queryFn: () => healthApi.getHealthLogs(parentId) });
}

export function useMedicines(parentId?: string) {
  return useQuery({ queryKey: q.medicines(parentId), queryFn: () => healthApi.getMedicines(parentId) });
}

export function useSubmitCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: healthApi.CheckInPayload) => healthApi.submitCheckIn(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: q.healthLogs() });
    },
  });
}

export function useCreateMedicine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: healthApi.MedicinePayload) => healthApi.createMedicine(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medicines"] });
    },
  });
}

export function useUpdateMedicine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<healthApi.MedicinePayload> }) => healthApi.updateMedicine(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medicines"] });
    },
  });
}

export function useDeleteMedicine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => healthApi.deleteMedicine(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medicines"] });
    },
  });
}

/* ---------- Reports & notifications ---------- */

export function useReports() {
  return useQuery({ queryKey: q.reports, queryFn: () => reportsApi.getReports() });
}

export function useGenerateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (report_type: "weekly" | "monthly") => reportsApi.generateReport(report_type),
    onSuccess: () => qc.invalidateQueries({ queryKey: q.reports }),
  });
}

export function useNotifications() {
  return useQuery<AppNotification[]>({
    queryKey: q.notifications,
    queryFn: () => getNotifications(),
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: q.notifications }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: q.notifications }),
  });
}

/* ---------- Engagement ---------- */

export function useQuizQuestions() {
  return useQuery({ queryKey: q.quizQuestions, queryFn: () => engagementApi.getQuizQuestions() });
}

export function useQuizAnswers() {
  return useQuery({ queryKey: q.quizAnswers, queryFn: () => engagementApi.getQuizAnswers() });
}

export function useSubmitQuizAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { quizQuestionId: string; familyMemberId: string; answerText: string }) =>
      engagementApi.submitQuizAnswer(payload.quizQuestionId, payload.familyMemberId, payload.answerText),
    onSuccess: () => qc.invalidateQueries({ queryKey: q.quizAnswers }),
  });
}

export function useTodayLegacyQuestion() {
  return useQuery({ queryKey: [...q.legacyQuestions, "today"], queryFn: () => engagementApi.getTodayLegacyQuestion() });
}

export function useLegacyAnswers() {
  return useQuery({ queryKey: q.legacyAnswers, queryFn: () => engagementApi.getLegacyAnswers() });
}

export function useSubmitLegacyAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { parentId: string; questionText: string; answerText: string }) =>
      engagementApi.submitLegacyAnswer(payload.parentId, payload.questionText, payload.answerText),
    onSuccess: () => qc.invalidateQueries({ queryKey: q.legacyAnswers }),
  });
}

/* ---------- AI ---------- */

export function useConversation(type: "parent_chatbot" | "offspring_chatbot") {
  return useQuery({ queryKey: q.conversation(type), queryFn: () => getConversation(type) });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof sendMessage>[0]) => sendMessage(payload),
    onSuccess: (_, variables) => {
      const type = variables.role === "parent" ? "parent_chatbot" : "offspring_chatbot";
      qc.invalidateQueries({ queryKey: q.conversation(type) });
    },
  });
}

/* ---------- Auth helpers ---------- */

export function useRegister() {
  return useMutation({ mutationFn: (payload: authApi.RegisterPayload) => authApi.register(payload) });
}
