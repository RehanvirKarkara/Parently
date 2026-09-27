import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuizAnswers, useQuizQuestions } from "@/hooks/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { QuizSkeleton } from "@/components/shared/RichSkeletons";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

export function QuizPage() {
  const navigate = useNavigate();
  const { data: questions, isLoading, isError, refetch } = useQuizQuestions();
  const { data: answers } = useQuizAnswers();
  const user = useAuthStore((s) => s.user);

  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);

  const question = questions?.[index];

  const answerFor = (questionId: string) => answers?.filter((a) => a.quiz_question_id === questionId) ?? [];
  const myAnswer = (questionId: string) => picks[questionId];

  const score = useMemo(() => {
    let s = 0;
    for (const q of questions ?? []) {
      const correct = answerFor(q.id);
      const best = correct.length
        ? correct
            .map((a) => a.answer_text)
            .sort((a, b) => a.localeCompare(b))[Math.floor(correct.length / 2)]
        : null;
      if (best && picks[q.id] === best) s++;
    }
    return s;
  }, [questions, picks]);

  const pick = (option: string) => {
    if (!question) return;
    setPicks((p) => ({ ...p, [question.id]: option }));
    setRevealed(true);
  };

  const next = () => {
    if (!questions) return;
    setRevealed(false);
    if (index < questions.length - 1) {
      setIndex((i) => i + 1);
    } else {
      setFinished(true);
    }
  };

  if (isLoading) {
    return <QuizSkeleton />;
  }

  if (isError) {
    return <ErrorState title="The quiz is unavailable" onRetry={() => void refetch()} />;
  }

  if (!questions?.length) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <EmptyState
          icon={Sparkles}
          title="No quiz questions yet"
          description="The family knowledge quiz will light up here once questions are published."
        />
      </div>
    );
  }

  if (finished) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="p-10 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-coral"
            >
              <Trophy className="h-9 w-9" />
            </motion.div>
            <h2 className="font-heading text-2xl font-semibold tracking-[-0.025em]">Quiz complete!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You matched the family consensus on{" "}
               <span className="font-metric font-semibold text-primary">{score} of {questions.length}</span> questions.
            </p>
            <div className="mx-auto mt-6 flex max-w-xs flex-col gap-2">
              <div className="flex items-center gap-3 rounded-xl border border-secondary/15 bg-secondary/8 p-4">
                <span className="font-metric text-2xl font-semibold text-secondary">{score}</span>
                <span className="text-sm font-medium text-muted-foreground">You know the family best on…</span>
              </div>
              {answers?.some((a) => a.answer_text) && (
                <p className="text-xs text-muted-foreground">Your picks have been shared with the family circle.</p>
              )}
            </div>
            <div className="mt-8 flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setPicks({});
                  setIndex(0);
                  setFinished(false);
                  setRevealed(false);
                }}
              >
                <RotateCcw /> Play again
              </Button>
              <Button onClick={() => navigate("/family")}>Back to family</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!question) return null;

  const others = answerFor(question.id).filter((a) => a.family_member_id !== user?.id);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="Family fun"
        title="Family Bonding Quiz"
        description="How well do you know Mom and Dad? Pick an answer, then see what everyone else chose."
        actions={
          <Button variant="ghost" onClick={() => navigate("/family")}>
            <ArrowLeft /> Family hub
          </Button>
        }
      />

      <div className="mb-5 flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">
          Question {index + 1} <span className="text-muted-foreground">of {questions.length}</span>
        </span>
        <Badge variant="muted">{question.category}</Badge>
      </div>
      <div className="mb-6 flex gap-1.5">
        {questions.map((q, i) => (
          <div key={q.id} className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= index ? "bg-primary" : "bg-muted")} aria-hidden="true" />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={question.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
          <Card>
            <CardContent className="p-6 sm:p-8">
              <h2 className="font-heading text-xl font-semibold leading-snug text-foreground">{question.question_text}</h2>

              <div className="mt-6 grid gap-2.5">
                {question.options.map((option) => {
                  const isPicked = myAnswer(question.id) === option;
                  const isConsensus = revealed && others.some((a) => a.answer_text === option);
                  return (
                    <motion.button
                      key={option}
                      whileTap={{ scale: revealed ? 1 : 0.98 }}
                      onClick={() => !revealed && pick(option)}
                      disabled={revealed}
                      className={cn(
                         "group flex min-h-14 items-center gap-3 rounded-xl border p-4 text-left text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 motion-reduce:transform-none",
                        revealed && isPicked
                           ? "border-primary/30 bg-primary/8 text-primary"
                          : revealed && isConsensus
                            ? "border-secondary/50 bg-secondary/5 text-foreground"
                            : "border-border/80 bg-card text-foreground hover:border-primary/50 hover:shadow-soft-sm",
                        revealed && "cursor-default",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors",
                           revealed && isPicked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                        )}
                      >
                        {revealed && isPicked ? <CheckCircle2 className="h-4 w-4" /> : String.fromCharCode(65 + question.options.indexOf(option))}
                      </span>
                      {option}
                      {revealed && isConsensus && !isPicked && (
                        <Badge variant="success" className="ml-auto">Family pick</Badge>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {revealed && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-xl border border-border/60 bg-muted/35 p-4">
                  <p className="mb-3 flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-warning-foreground" /> What the family said
                  </p>
                  {others.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No family answers yet — be the first!</p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {others.map((a) => (
                        <div key={a.id} className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 shadow-soft-sm">
                          <PersonAvatar first={a.family_member_id === "fm-2" ? "Jamie" : "Riley"} last="" color={a.family_member_id === "fm-2" ? "mint" : "coral"} size="sm" />
                          <span className="text-sm font-medium text-foreground">{a.answer_text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {revealed && (
                <div className="mt-6 flex justify-end">
                  <Button onClick={next}>
                    {index < questions.length - 1 ? (
                      <>Next question <ArrowRight /></>
                    ) : (
                      <>See results <Trophy /></>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
