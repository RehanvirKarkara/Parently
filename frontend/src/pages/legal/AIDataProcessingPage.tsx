import { LegalLayout } from "./LegalLayout";
import { Bot, Cpu, Database, EyeOff, Sparkles } from "lucide-react";

export function AIDataProcessingPage() {
  return (
    <LegalLayout
      title="AI & Data Processing Disclosure"
      badge="Algorithmic Transparency"
      version="1.0"
      effectiveDate="September 27, 2026"
    >
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">1. Our Commitment to AI Transparency</h2>
        <p>
          Parently incorporates modern artificial intelligence to minimize caregiving friction, assist in interpreting routine daily logs, and generate empathetic wellness suggestions. We believe you deserve complete transparency regarding where your data travels, how models are queried, and how you retain control.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">2. Actual AI Architecture & Providers</h2>
        <p className="text-sm">
          Unlike general statements found on generic platforms, this section documents the actual, active AI components deployed within Parently:
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="p-4 rounded-xl bg-card border border-border/60 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Cpu className="w-5 h-5 text-primary" />
              <span>Groq Cloud LLM Inference</span>
            </div>
            <p className="text-xs text-muted-foreground leading-normal">
              <strong>Model:</strong> Open-weights foundation models (such as Llama 3.3 70B Versatile and Qwen).
            </p>
            <p className="text-xs text-muted-foreground leading-normal">
              <strong>Purpose:</strong> Answers care questions, drafts check-in summaries, and provides thoughtful guidance.
            </p>
            <p className="text-xs text-muted-foreground leading-normal">
              <strong>Data Sent:</strong> Ephemeral prompt containing the user question and sanitized recent check-in snippets. No persistent model training.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border/60 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Database className="w-5 h-5 text-indigo-500" />
              <span>ChromaDB Vector Store & RAG</span>
            </div>
            <p className="text-xs text-muted-foreground leading-normal">
              <strong>Embeddings:</strong> Nomic Text Embeddings (<code className="text-[11px] bg-muted px-1 rounded">nomic-embed-text-v1.5</code>).
            </p>
            <p className="text-xs text-muted-foreground leading-normal">
              <strong>Purpose:</strong> Semantic search over past family check-ins and notes (Retrieval-Augmented Generation).
            </p>
            <p className="text-xs text-muted-foreground leading-normal">
              <strong>Data Stored:</strong> Vector representations of health check-ins, deleted automatically upon account erasure.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-foreground font-bold text-xl">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2>3. Features Powered by AI</h2>
        </div>
        <ul className="list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Care Assistant (Chat):</strong> Offspring caregivers and parents can ask questions about sleep patterns, meal trends, or activity levels.</li>
          <li><strong>Weekly Care Summaries:</strong> Generates concise family digests highlighting positive streaks and areas for follow-up.</li>
          <li><strong>Check-In Reflection Prompts:</strong> Suggests gentle conversational questions for seniors during daily check-ins.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-foreground font-bold text-xl">
          <EyeOff className="w-5 h-5 text-amber-500" />
          <h2>4. What AI Does NOT Do</h2>
        </div>
        <ul className="list-disc pl-5 space-y-1.5 text-sm">
          <li>AI does not provide medical diagnoses or prescribe medications.</li>
          <li>AI does not sell or broker your health data to advertising networks.</li>
          <li>AI output does not trigger automated clinical actions or override doctor prescriptions.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-foreground font-bold text-xl">
          <Bot className="w-5 h-5 text-primary" />
          <h2>5. User Controls & Consent Withdrawal</h2>
        </div>
        <p className="text-sm">
          AI processing is an optional platform capability. If you prefer that your conversational messages and health snippets are not processed by LLMs, you can withdraw your AI processing consent at any time inside the <strong>Privacy Center</strong> in Settings.
        </p>
      </section>
    </LegalLayout>
  );
}
