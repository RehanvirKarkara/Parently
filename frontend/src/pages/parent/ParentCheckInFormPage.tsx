import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Clock3, Footprints, MoonStar, Pill, Star, Utensils } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { DAY_RATING_LABELS, CHECKIN_WINDOWS } from "@/lib/constants";
import { useHealthLogs, useParent, useSubmitCheckIn } from "@/hooks/queries";
import { useAuthStore } from "@/stores/authStore";
import { cn, todayISO } from "@/lib/utils";
import type { TimeOfDay } from "@/types";

const PERIOD_ORDER: TimeOfDay[] = ["morning", "afternoon", "evening"];

export function ParentCheckInFormPage() {
  const { period = "morning" } = useParams();
  const navigate = useNavigate();
  const parentId = useAuthStore((s) => s.parentId) ?? "p-mom";
  const { data: parent, isLoading: loadingParent, isError: parentError, refetch: refetchParent } = useParent(parentId);
  const { data: logs, isLoading: loadingLogs, isError: logsError, refetch: refetchLogs } = useHealthLogs(parentId);
  const submit = useSubmitCheckIn();

  const validPeriod = (PERIOD_ORDER as string[]).includes(period) ? (period as TimeOfDay) : "morning";
  const existing = useMemo(() => (logs ?? []).find((l) => l.log_date === todayISO() && l.log_time_of_day === validPeriod), [logs, validPeriod]);

  const [hoursSlept, setHoursSlept] = useState<number>(existing?.hours_slept ?? 7);
  const [medsTaken, setMedsTaken] = useState<boolean>(existing?.meds_taken ?? true);
  const [breakfast, setBreakfast] = useState(existing?.breakfast_details ?? "");
  const [lunch, setLunch] = useState(existing?.lunch_details ?? "");
  const [stepsAfternoon, setStepsAfternoon] = useState<string>(existing?.steps_walked_afternoon?.toString() ?? "");
  const [workout, setWorkout] = useState(existing?.workout_details ?? "");
  const [dinner, setDinner] = useState(existing?.snacks_dinner_details ?? "");
  const [stepsEvening, setStepsEvening] = useState<string>(existing?.steps_walked_evening?.toString() ?? "");
  const [rating, setRating] = useState<number>(existing?.day_rating ?? 0);

  const meta = CHECKIN_WINDOWS[validPeriod];
  const currentIndex = PERIOD_ORDER.indexOf(validPeriod);
  const nextPeriod = PERIOD_ORDER[currentIndex + 1];

  const saving = submit.isPending;

  const handleSave = async (advance: boolean) => {
    const payload = {
      parent_id: parentId,
      log_date: todayISO(),
      log_time_of_day: validPeriod,
      ...(validPeriod === "morning" && { hours_slept: hoursSlept, meds_taken: medsTaken, breakfast_details: breakfast || null }),
      ...(validPeriod === "afternoon" && { lunch_details: lunch || null, steps_walked_afternoon: stepsAfternoon ? Number(stepsAfternoon) : null, workout_details: workout || null }),
      ...(validPeriod === "evening" && { snacks_dinner_details: dinner || null, steps_walked_evening: stepsEvening ? Number(stepsEvening) : null, day_rating: rating || null }),
    };
    try {
      await submit.mutateAsync(payload);
      toast.success(`${meta.label} check-in saved`);
      if (advance && nextPeriod) {
        navigate(`/parent/check-in/${nextPeriod}`);
      } else {
        navigate("/parent/check-ins");
      }
    } catch {
      toast.error("Couldn't save your check-in. Please try again.");
    }
  };

  if (loadingParent || loadingLogs) {
    return (
      <div className="mx-auto max-w-3xl space-y-6" aria-busy="true" aria-label="Loading check-in form">
        <Skeleton className="h-6 w-36 rounded-md" />
        <div className="rounded-2xl border border-border/50 bg-card p-6 sm:p-8 space-y-8 shadow-soft">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48 rounded-lg" />
              <Skeleton className="h-4 w-64 rounded-md" />
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (parentError || logsError || !parent) {
    return (
      <ErrorState
        title="This check-in is unavailable"
        onRetry={() => {
          void refetchParent();
          void refetchLogs();
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
         <button
           onClick={() => navigate("/parent/check-ins")}
           className="mb-6 inline-flex min-h-10 items-center gap-1.5 rounded-lg text-sm font-semibold text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
      >
        <ArrowLeft className="h-4 w-4" /> Back to check-ins
      </button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden">
          <div className={cn("h-2 w-full", validPeriod === "morning" ? "bg-gradient-to-r from-warning to-warning/50" : validPeriod === "afternoon" ? "bg-gradient-to-r from-accent to-coral-400" : "bg-gradient-to-r from-primary to-indigo-500")} />
          <CardContent className="p-6 sm:p-8">
            <div className="mb-8 flex items-center gap-4">
              <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl", validPeriod === "morning" ? "bg-warning/12 text-warning-foreground" : validPeriod === "afternoon" ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary")}>
                {validPeriod === "morning" ? <Clock3 className="h-7 w-7" /> : validPeriod === "afternoon" ? <Footprints className="h-7 w-7" /> : <Star className="h-7 w-7" />}
              </div>
              <div>
                 <h1 className="font-heading text-2xl font-semibold leading-tight text-foreground">{meta.label} check-in</h1>
                <p className="text-sm text-muted-foreground">{meta.time} · {meta.description}</p>
              </div>
            </div>

            <div className="space-y-7">
              {validPeriod === "morning" && (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="hours-slept" className="flex items-center gap-2"><MoonStar className="h-4 w-4 text-primary" /> Hours slept last night</Label>
                      <span className="rounded-xl bg-primary/10 px-3 py-1 font-metric text-sm font-bold text-primary">{hoursSlept.toFixed(1)}h</span>
                    </div>
                    <Slider
                      id="hours-slept"
                      aria-label="Hours slept last night"
                      min={0}
                      max={12}
                      step={0.5}
                      value={[hoursSlept]}
                      onValueChange={([v]) => setHoursSlept(v)}
                    />
                  </div>

                   <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-muted/25 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary"><Pill className="h-5 w-5" /></div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Took my morning medicines</p>
                        <p className="text-xs text-muted-foreground">Including Metformin & Amlodipine</p>
                      </div>
                    </div>
                    <Switch aria-label="Took my morning medicines" checked={medsTaken} onCheckedChange={setMedsTaken} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="breakfast" className="flex items-center gap-2"><Utensils className="h-4 w-4 text-warning-foreground" /> What did you have for breakfast?</Label>
                    <Textarea id="breakfast" value={breakfast} onChange={(e) => setBreakfast(e.target.value)} placeholder="Oats with berries and a cup of tea…" />
                  </div>
                </>
              )}

              {validPeriod === "afternoon" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="lunch" className="flex items-center gap-2"><Utensils className="h-4 w-4 text-accent" /> Lunch details</Label>
                    <Textarea id="lunch" value={lunch} onChange={(e) => setLunch(e.target.value)} placeholder="Grilled fish with vegetables and rice…" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="steps-afternoon" className="flex items-center gap-2"><Footprints className="h-4 w-4 text-accent" /> Steps walked so far today</Label>
                    <Input id="steps-afternoon" type="number" min={0} value={stepsAfternoon} onChange={(e) => setStepsAfternoon(e.target.value)} placeholder="e.g. 4200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workout" className="flex items-center gap-2"><MoonStar className="h-4 w-4 text-accent" /> Any workout or activity?</Label>
                    <Textarea id="workout" value={workout} onChange={(e) => setWorkout(e.target.value)} placeholder="Walked to the park, 30 min of yoga…" />
                  </div>
                </>
              )}

              {validPeriod === "evening" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="dinner" className="flex items-center gap-2"><Utensils className="h-4 w-4 text-primary" /> What did you have for dinner?</Label>
                    <Textarea id="dinner" value={dinner} onChange={(e) => setDinner(e.target.value)} placeholder="Soup, salad, and a slice of sourdough…" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="steps-evening" className="flex items-center gap-2"><Footprints className="h-4 w-4 text-primary" /> Steps walked after dinner</Label>
                    <Input id="steps-evening" type="number" min={0} value={stepsEvening} onChange={(e) => setStepsEvening(e.target.value)} placeholder="e.g. 1800" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="day-rating" className="flex items-center gap-2"><Star className="h-4 w-4 text-warning-foreground" /> How was your day overall?</Label>
                     <div id="day-rating" className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Day rating">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <motion.button
                          key={n}
                          type="button"
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setRating(n)}
                          aria-pressed={rating === n}
                          aria-label={`Rate your day ${n} out of 10`}
                          className={cn(
                             "flex h-11 flex-col items-center justify-center rounded-xl border text-sm font-semibold transition-[color,background-color,border-color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 motion-reduce:transform-none",
                             rating === n ? "border-primary bg-primary text-primary-foreground shadow-soft" : "border-border/70 bg-card text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-foreground",
                          )}
                        >
                          {n}
                          {rating === n && <Check className="h-3 w-3" />}
                        </motion.button>
                      ))}
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {rating ? DAY_RATING_LABELS[rating] : "Tap a number to rate your day"}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => void handleSave(false)}
                disabled={saving}
                isLoading={saving}
                loadingText="Saving…"
              >
                Save
              </Button>
              {nextPeriod ? (
                <Button
                  onClick={() => void handleSave(true)}
                  disabled={saving}
                  isLoading={saving}
                  loadingText="Saving & continuing…"
                  icon={<ArrowRight className="h-4 w-4" />}
                >
                  Save & continue
                </Button>
              ) : (
                <Button
                  onClick={() => void handleSave(false)}
                  disabled={saving}
                  isLoading={saving}
                  loadingText="Saving check-in…"
                  icon={<Check className="h-4 w-4" />}
                >
                  Finish check-in
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
