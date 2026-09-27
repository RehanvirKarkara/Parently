import { apiRequest, mockDelay, USE_MOCK } from "@/api/client";
import { mockDb } from "@/api/mockDb";
import type { AIConversation, ChatMessage, HealthInsightRef } from "@/types";

export interface AskPayload {
  role: "offspring" | "parent";
  parent_id: string;
  message: string;
  history: ChatMessage[];
}

export async function getConversation(conversationType: "parent_chatbot" | "offspring_chatbot"): Promise<AIConversation | null> {
  if (USE_MOCK) {
    await mockDelay(200);
    return mockDb.conversations.find((c) => c.conversation_type === conversationType) ?? null;
  }
  return apiRequest<AIConversation>(`/ai/conversations/${conversationType}`);
}

/** Sends a message to the AI assistant and returns a generated reply. */
export async function sendMessage(payload: AskPayload): Promise<{ reply: ChatMessage }> {
  if (USE_MOCK) {
    await mockDelay(1400);
    const reply = generateMockReply(payload.role, payload.message, payload.parent_id);
    const conv = mockDb.conversations.find((c) =>
      payload.role === "parent"
        ? c.conversation_type === "parent_chatbot" && c.parent_id === payload.parent_id
        : c.conversation_type === "offspring_chatbot",
    );
    const message: ChatMessage = {
      id: `cm-${Date.now()}`,
      role: "assistant",
      content: reply.content,
      timestamp: new Date().toISOString(),
      insight: reply.insight,
    };
    if (conv) {
      conv.message_history.push({ id: `cm-${Date.now()}-u`, role: "user", content: payload.message, timestamp: new Date().toISOString(), insight: null });
      conv.message_history.push(message);
      conv.updated_at = new Date().toISOString();
    }
    return { reply: message };
  }
  return apiRequest<{ reply: ChatMessage }>("/ai/chat", { method: "POST", body: payload });
}

function generateMockReply(role: "offspring" | "parent", message: string, parentId: string): { content: string; insight?: HealthInsightRef | null } {
  const parent = mockDb.parents.find((p) => p.id === parentId);
  const firstName = parent?.first_name ?? "your parent";
  const logs = mockDb.healthLogs.filter((l) => l.parent_id === parentId);
  const recent = logs.slice(0, 7);
  const avgSleep = recent.length ? (recent.reduce((s, l) => s + (l.hours_slept ?? 0), 0) / recent.length).toFixed(1) : "—";
  const lastRating = logs.find((l) => l.day_rating != null)?.day_rating;

  const text = message.toLowerCase();
  const insight: HealthInsightRef | undefined =
    /sleep|insomnia|tired|energy/.test(text)
      ? { kind: "sleep", title: `Average sleep this week`, value: `${avgSleep}h` }
      : /step|walk|exercise|activity/.test(text)
        ? { kind: "steps", title: "Steps tracked", value: "—" }
        : /medic|pill|dose|prescri/.test(text)
          ? { kind: "meds", title: "Medicine adherence", value: "High" }
          : /rating|feel|mood|okay/.test(text)
            ? { kind: "rating", title: "Recent day rating", value: lastRating ?? "—" }
            : /worry|risk|concern|emergency/.test(text)
              ? { kind: "alert", title: "Pattern watch", value: "Normal" }
              : undefined;

  if (role === "parent") {
    return {
      content:
        `I looked through your recent check-ins. Here's what stands out:\n\n` +
        `• You're averaging **${avgSleep} hours** of sleep over the past week, which is close to your typical range.\n` +
        `• Your medicine adherence has been consistent — great work staying on schedule.\n` +
        `• On days you move more in the afternoon, your evening rating tends to be a point higher.\n\n` +
        `Based on your question about “${message}”, I'd gently suggest keeping a small daily note in your check-in so we can spot patterns together. ` +
        `Would you like me to watch this specific area for the next week?`,
      insight,
    };
  }

  return {
    content:
      `I've been analyzing ${firstName}'s data over the last week. Here's the pattern:\n\n` +
      `• Sleep is averaging **${avgSleep} hours** — ${parseFloat(avgSleep) >= 7 ? "within a healthy range" : "a little under the 7-hour target"}.\n` +
      `• Their day rating has been stable around a **${lastRating ?? "good"}**, with no unusual dips.\n` +
      `• No significant deviation from their normal medicine and activity routines.\n\n` +
      `In response to “${message}”, I don't see anything that needs urgent attention right now. ` +
      `I'll keep monitoring this area and will notify you immediately if the trend changes for 3 consecutive days.`,
    insight,
  };
}
