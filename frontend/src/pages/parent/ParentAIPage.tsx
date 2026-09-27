import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUp, Loader2, ShieldAlert, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useConversation, useParent, useSendMessage } from "@/hooks/queries";
import { makeAssistantMessage } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { ErrorState } from "@/components/shared/ErrorState";
import { AIThinkingIndicator } from "@/components/shared/AIThinkingIndicator";
import { ChatSkeleton } from "@/components/shared/RichSkeletons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { MedicalDisclaimerBanner } from "@/components/shared/MedicalDisclaimerBanner";
import type { ChatMessage } from "@/types";

const suggestedPrompts = [
  "Why have I been sleeping less lately?",
  "How was my week overall?",
  "Should I be worried about anything?",
  "Give me a small tip for more energy",
];

export function ParentAIPage() {
  const parentId = useAuthStore((s) => s.parentId) ?? "p-mom";
  const { data: parent } = useParent(parentId);
  const sendMessage = useSendMessage();
  const { data: conversation, isLoading, isError, refetch } = useConversation("parent_chatbot");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (conversation && !hasStarted) {
      setMessages(conversation.message_history.map((m) => ({ ...m })));
    }
  }, [conversation, hasStarted]);

  useEffect(() => {
    const viewport = scrollRef.current?.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]");
    viewport?.scrollTo({ top: viewport.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
  }, [messages, reduceMotion, sendMessage.isPending]);

  const submit = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || sendMessage.isPending) return;
    const userMsg = makeAssistantMessage("user", content);
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setHasStarted(true);
    try {
      const res = await sendMessage.mutateAsync({
        role: "parent",
        parent_id: parentId,
        message: content,
        history: messages,
      });
      setMessages((m) => [...m, res.reply]);
    } catch {
      setMessages((m) => [...m, makeAssistantMessage("assistant", "I couldn't reach the AI service just now. Please try again in a moment.")]);
      toast.error("Unable to reach the AI service");
    }
  };

  return (
    <div className="flex h-[calc(100dvh-12rem)] min-h-[24rem] flex-col lg:h-[calc(100dvh-8.5rem)] lg:min-h-[34rem]">
      <div className="mb-4">
         <h1 className="font-heading text-2xl font-semibold leading-tight">Your Health Coach</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A gentle companion that learns from your check-ins and helps you feel your best.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/95 shadow-soft-md">
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="relative">
               <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10 text-secondary ring-1 ring-inset ring-secondary/10">
                <Sparkles className="h-[18px] w-[18px]" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Parently Coach</p>
               <p className="text-xs text-muted-foreground">Tuned to your own health data{parent ? ` · ${parent.first_name}` : ""}</p>
            </div>
          </div>
           <div className="hidden items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1.5 text-xs font-semibold text-secondary ring-1 ring-inset ring-secondary/10 sm:flex">
            <ShieldAlert className="h-3.5 w-3.5 text-secondary" />
            Private & secure
          </div>
        </div>

        {/* Clinical & AI Medical Disclaimer */}
        <div className="px-3 sm:px-4 pt-2">
          <MedicalDisclaimerBanner compact dismissible />
        </div>

        <ScrollArea ref={scrollRef} className="flex-1">
          <div className="space-y-5 px-4 py-5 sm:px-5 sm:py-6">
            {isLoading ? (
              <ChatSkeleton />
            ) : isError ? (
              <ErrorState className="my-6 min-h-56" title="The conversation is unavailable" onRetry={() => void refetch()} />
            ) : messages.length === 0 ? (
              <WelcomeState onPrompt={(p) => void submit(p)} />
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <ChatBubble key={msg.id} message={msg} />
                ))}
              </AnimatePresence>
            )}
            {sendMessage.isPending && (
              <div className="pt-2">
                <AIThinkingIndicator
                  stages={[
                    "Reviewing your check-ins & vitals…",
                    "Spotting vitality patterns…",
                    "Preparing your personalized wellness advice…",
                  ]}
                />
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-border/60 bg-card/95 p-3 backdrop-blur-xl sm:p-4">
          {messages.length > 0 && (
            <div className="mb-2.5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {suggestedPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => void submit(p)}
                   className="min-h-9 shrink-0 rounded-full border border-border/70 bg-background px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-secondary/40 hover:bg-secondary/5 hover:text-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/15"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
            className="flex items-end gap-2"
          >
            <Textarea
              aria-label="Ask about your sleep, energy, or anything"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submit();
                }
              }}
              placeholder="Ask about your sleep, energy, or anything…"
               className="max-h-32 min-h-[52px] resize-none rounded-xl"
              rows={1}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="submit"
              disabled={!input.trim() || sendMessage.isPending}
               className="flex size-[52px] shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-mint transition-[transform,background-color,box-shadow] hover:brightness-[1.04] disabled:opacity-40"
              aria-label="Send message"
            >
              {sendMessage.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
            </motion.button>
          </form>
          <p className="mt-2 text-center text-[0.6875rem] leading-4 text-muted-foreground">
            Parently AI provides insights, not medical advice. Contact a doctor for clinical concerns.
          </p>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn("flex gap-3", isUser && "flex-row-reverse")}
    >
      {!isUser && (
         <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
          <Sparkles className="h-4 w-4" />
        </div>
      )}
       <div className={cn("min-w-0 max-w-[86%] break-words sm:max-w-[72%]", isUser && "text-right")}>
        <div
          className={cn(
            "inline-block rounded-2xl px-4 py-3 text-left text-sm leading-relaxed",
             isUser ? "rounded-tr-lg bg-secondary text-secondary-foreground" : "rounded-tl-lg border border-border/60 bg-muted/35 text-foreground",
          )}
        >
          <MarkdownContent text={message.content} />
        </div>
         <p className="mt-1 text-[0.6875rem] font-medium text-muted-foreground">{isUser ? "You" : "Parently Coach"}</p>
      </div>
    </motion.div>
  );
}

function MarkdownContent({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith("•") || line.startsWith("-")) {
          return (
            <p key={i} className="pl-1">
              <span className="mr-2 text-secondary">•</span>
              {renderInline(line.replace(/^[•-]\s*/, ""))}
            </p>
          );
        }
        if (/^\*\*.*\*\*$/.test(line.trim())) {
          return <p key={i} className="font-semibold">{renderInline(line.trim().replace(/^\*\*|\*\*$/g, ""))}</p>;
        }
        if (line.trim() === "") return <div key={i} className="h-2" />;
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function WelcomeState({ onPrompt }: { onPrompt: (p: string) => void }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
         transition={{ type: "spring", stiffness: 280, damping: 26 }}
         className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary/10 text-secondary ring-1 ring-inset ring-secondary/10"
      >
        <Sparkles className="h-9 w-9" />
      </motion.div>
       <h2 className="font-heading text-xl font-semibold tracking-[-0.025em] text-foreground">How are you feeling today?</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        I review your check-ins, spot patterns, and offer small, gentle suggestions — all in private.
      </p>
      <div className="mt-8 grid w-full max-w-md gap-2.5">
        {suggestedPrompts.map((p, i) => (
          <motion.button
            key={p}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            onClick={() => onPrompt(p)}
             className="min-h-12 rounded-xl border border-border/70 bg-card px-4 py-3 text-left text-sm font-medium text-foreground shadow-soft-xs transition-[border-color,box-shadow,transform] hover:border-secondary/35 hover:shadow-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/15 motion-reduce:transform-none"
          >
            {p}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
