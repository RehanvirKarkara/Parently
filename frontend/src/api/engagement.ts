import { apiRequest, mockDelay, USE_MOCK } from "@/api/client";
import { mockDb } from "@/api/mockDb";
import type { LegacyAnswer, LegacyQuestion, QuizAnswer, QuizQuestion } from "@/types";

/* ---------- Family Bonding Quiz ---------- */

export async function getQuizQuestions(): Promise<QuizQuestion[]> {
  if (USE_MOCK) {
    await mockDelay(260);
    return mockDb.quizQuestions;
  }
  return apiRequest<QuizQuestion[]>("/quiz/questions");
}

export async function getQuizAnswers(): Promise<QuizAnswer[]> {
  if (USE_MOCK) {
    await mockDelay(240);
    return mockDb.quizAnswers;
  }
  return apiRequest<QuizAnswer[]>("/quiz/answers");
}

export async function submitQuizAnswer(quizQuestionId: string, familyMemberId: string, answerText: string): Promise<QuizAnswer> {
  if (USE_MOCK) {
    await mockDelay(500);
    const answer: QuizAnswer = {
      id: `qa-${Date.now().toString(36)}`,
      quiz_question_id: quizQuestionId,
      family_member_id: familyMemberId,
      answer_text: answerText,
      answered_at: new Date().toISOString(),
    };
    mockDb.quizAnswers.push(answer);
    return answer;
  }
  return apiRequest<QuizAnswer>("/quiz/answers", { method: "POST", body: { quiz_question_id: quizQuestionId, family_member_id: familyMemberId, answer_text: answerText } });
}

/* ---------- Legacy Questions ---------- */

export async function getTodayLegacyQuestion(): Promise<LegacyQuestion | null> {
  if (USE_MOCK) {
    await mockDelay(200);
    return mockDb.legacyQuestions[0] ?? null;
  }
  return apiRequest<LegacyQuestion | null>("/legacy/questions/today");
}

export async function getLegacyQuestions(): Promise<LegacyQuestion[]> {
  if (USE_MOCK) {
    await mockDelay(220);
    return mockDb.legacyQuestions;
  }
  return apiRequest<LegacyQuestion[]>("/legacy/questions");
}

export async function getLegacyAnswers(): Promise<LegacyAnswer[]> {
  if (USE_MOCK) {
    await mockDelay(220);
    return [...mockDb.legacyAnswers].sort((a, b) => b.answered_at.localeCompare(a.answered_at));
  }
  return apiRequest<LegacyAnswer[]>("/legacy/answers");
}

export async function submitLegacyAnswer(parentId: string, questionText: string, answerText: string): Promise<LegacyAnswer> {
  if (USE_MOCK) {
    await mockDelay(600);
    const q = mockDb.legacyQuestions.find((q) => q.question_text === questionText);
    const legacyQuestionId = q?.id ?? `lq-${Date.now().toString(36)}`;
    if (!q) mockDb.legacyQuestions.unshift({ id: legacyQuestionId, question_text: questionText, created_at: new Date().toISOString() });
    const answer: LegacyAnswer = {
      id: `la-${Date.now().toString(36)}`,
      legacy_question_id: legacyQuestionId,
      parent_id: parentId,
      answer_text: answerText,
      answered_at: new Date().toISOString(),
    };
    mockDb.legacyAnswers.unshift(answer);
    return answer;
  }
  return apiRequest<LegacyAnswer>("/legacy/answers", { method: "POST", body: { parent_id: parentId, question_text: questionText, answer_text: answerText } });
}
