/**
 * In-memory mock database. Mirrors the PostgreSQL schema from the Database
 * Document. State is mutable for the current browser session so create/update
 * flows behave realistically during development.
 */
import {
  currentUser,
  family,
  familyMembers,
  healthLogs,
  legacyAnswers,
  legacyQuestions,
  medicines,
  notifications,
  offspringConversation,
  parentConversation,
  parents,
  quizAnswers,
  quizQuestions,
  reports,
  siblings,
  siblingInvites,
} from "@/lib/mockData";
import type {
  AIConversation,
  AppNotification,
  Family,
  FamilyMember,
  HealthLog,
  LegacyAnswer,
  LegacyQuestion,
  Medicine,
  Parent,
  QuizAnswer,
  QuizQuestion,
  Report,
  SiblingInvite,
  User,
} from "@/types";

export const mockDb = {
  users: structuredClone([currentUser, ...siblings]),
  parents: structuredClone(parents),
  family: structuredClone(family),
  familyMembers: structuredClone(familyMembers),
  healthLogs: structuredClone(healthLogs),
  medicines: structuredClone(medicines),
  reports: structuredClone(reports),
  notifications: structuredClone(notifications),
  quizQuestions: structuredClone(quizQuestions),
  quizAnswers: structuredClone(quizAnswers),
  legacyQuestions: structuredClone(legacyQuestions),
  legacyAnswers: structuredClone(legacyAnswers),
  conversations: structuredClone([offspringConversation, parentConversation]),
  siblingInvites: structuredClone(siblingInvites),
  otpStore: new Map<string, { code: string; purpose: string; expires_at: string }>(),
};

export function resetMockDb(): void {
  mockDb.users = structuredClone([currentUser, ...siblings]);
  mockDb.parents = structuredClone(parents);
  mockDb.family = structuredClone(family);
  mockDb.familyMembers = structuredClone(familyMembers);
  mockDb.healthLogs = structuredClone(healthLogs);
  mockDb.medicines = structuredClone(medicines);
  mockDb.reports = structuredClone(reports);
  mockDb.notifications = structuredClone(notifications);
  mockDb.quizQuestions = structuredClone(quizQuestions);
  mockDb.quizAnswers = structuredClone(quizAnswers);
  mockDb.legacyQuestions = structuredClone(legacyQuestions);
  mockDb.legacyAnswers = structuredClone(legacyAnswers);
  mockDb.conversations = structuredClone([offspringConversation, parentConversation]);
  mockDb.siblingInvites = structuredClone(siblingInvites);
  mockDb.otpStore.clear();
}

export type { AIConversation, AppNotification, Family, FamilyMember, HealthLog, LegacyAnswer, LegacyQuestion, Medicine, Parent, QuizAnswer, QuizQuestion, Report, SiblingInvite, User };
