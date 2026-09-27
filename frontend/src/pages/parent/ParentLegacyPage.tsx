import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, Heart, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLegacyAnswers, useParent, useSubmitLegacyAnswer, useTodayLegacyQuestion } from "@/hooks/queries";
import { useAuthStore } from "@/stores/authStore";
import { cn, formatDate } from "@/lib/utils";

export function ParentLegacyPage() {
  const parentId = useAuthStore((s) => s.parentId) ?? "p-mom";
  const { data: parent, isLoading: loadingParent, isError: parentError, refetch: refetchParent } = useParent(parentId);
  const { data: todayQuestion, isLoading: loadingQuestion, isError: questionError, refetch: refetchQuestion } = useTodayLegacyQuestion();
  const { data: allAnswers, isLoading: loadingAnswers, isError: answersError, refetch: refetchAnswers } = useLegacyAnswers();
  const submit = useSubmitLegacyAnswer();

  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const myAnswers = (allAnswers ?? []).filter((a) => a.parent_id === parentId);
  const alreadyAnswered = myAnswers.some((a) => a.legacy_question_id === todayQuestion?.id);

  const handleSubmit = async () => {
    const text = answer.trim();
    if (!text || !todayQuestion) return;
    try {
      await submit.mutateAsync({ parentId, questionText: todayQuestion.question_text, answerText: text });
      setAnswer("");
      setSubmitted(true);
      toast.success("Your memory has been shared with your family");
      setTimeout(() => setSubmitted(false), 3500);
    } catch {
      toast.error("Couldn't save your answer. Please try again.");
    }
  };

  if (loadingParent || loadingQuestion || loadingAnswers) {
    return (
      <div className="mx-auto max-w-3xl space-y-6" role="status" aria-label="Loading memories" aria-busy="true">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44 rounded-xl" />
          <Skeleton className="h-4 w-72 max-w-full rounded-md" />
        </div>
        <div className="rounded-3xl border border-border/50 bg-card p-6 sm:p-8 space-y-4 shadow-soft">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-36 rounded-full" />
          </div>
          <Skeleton className="h-8 w-3/4 rounded-lg" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-4 w-16 rounded-md" />
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
        </div>
        <div className="rounded-3xl border border-border/50 bg-card p-6 space-y-4 shadow-soft">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-44 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (parentError || questionError || answersError || !parent) {
    return (
      <ErrorState
        title="Memories are unavailable"
        onRetry={() => {
          void refetchParent();
          void refetchQuestion();
          void refetchAnswers();
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="For your family"
        title="Legacy & memories"
        description="Answer gentle questions about your life — your words become a keepsake your family will always treasure."
      />

      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-accent via-coral-400 to-accent" />
            <CardContent className="p-6 sm:p-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <Badge variant="accent" className="px-3 py-1">Question of the day</Badge>
                {alreadyAnswered && <Badge variant="success"><CheckCircle2 className="h-3.5 w-3.5" /> Answered</Badge>}
              </div>
               <h2 className="font-heading text-xl font-semibold leading-snug text-foreground">{todayQuestion?.question_text}</h2>

              {alreadyAnswered ? (
                 <div className="mt-6 flex flex-col items-center rounded-xl border border-secondary/15 bg-secondary/8 py-10 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/12 text-secondary">
                    <Heart className="h-7 w-7" />
                  </div>
                  <p className="font-heading text-base font-bold text-foreground">You've shared your answer</p>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">Your family can now read this memory. There's always a new question tomorrow.</p>
                </div>
              ) : (
                 <div className="mt-6 space-y-4">
                   <Label htmlFor="legacy-answer" className="font-medium">Your memory</Label>
                   <Textarea
                     id="legacy-answer"
                     value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Share a memory, a feeling, or a few words…"
                     className="min-h-[140px] resize-none"
                    maxLength={600}
                  />
                   <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                    <span className="text-xs text-muted-foreground">{answer.length}/600</span>
                     <div className="flex flex-wrap items-center gap-3">
                      {submitted && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 text-xs font-semibold text-secondary">
                          <CheckCircle2 className="h-4 w-4" /> Shared with family
                        </motion.span>
                      )}
                      <Button
                        variant="accent"
                        onClick={() => void handleSubmit()}
                        disabled={!answer.trim() || submit.isPending}
                        isLoading={submit.isPending}
                        loadingText="Sharing memory…"
                        icon={<Sparkles className="h-4 w-4" />}
                      >
                        Share this memory
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4 text-accent" /> Memories you've shared
              </CardTitle>
              <Badge variant="accent">{myAnswers.length} total</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {myAnswers.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No memories yet"
                  description="Your answers will gather here like pages of a family book."
                  className="py-12"
                />
              ) : (
                myAnswers.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                     className="rounded-xl border border-border/70 bg-card/70 p-5"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                       <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{formatDate(a.answered_at)}</p>
                      <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl bg-accent/15 text-accent")}>
                        <Heart className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">"{a.answer_text}"</p>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        <p className="flex items-center justify-center gap-1.5 pb-4 text-center text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-accent" /> Shared with {parent?.first_name}'s family circle — private and only for them.
        </p>
      </div>
    </div>
  );
}
