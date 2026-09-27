import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Heart,
  HeartPulse,
  Mail,
  PartyPopper,
  Pill,
  Plus,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import * as familiesApi from "@/api/families";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressIndicator } from "@/components/shared/ProgressIndicator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { OtpInput } from "@/components/shared/OtpInput";
import { PageHeader } from "@/components/shared/PageHeader";
import { useInviteSibling } from "@/hooks/queries";
import { cn } from "@/lib/utils";

type Step = "profile" | "medical" | "medicines" | "review" | "otp" | "done";

interface DraftMedicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
}

const stepMeta: Record<Step, { label: string; index: number }> = {
  profile: { label: "About your parent", index: 1 },
  medical: { label: "Medical details", index: 2 },
  medicines: { label: "Medicines", index: 3 },
  review: { label: "Review & send", index: 4 },
  otp: { label: "Verify", index: 5 },
  done: { label: "Done", index: 6 },
};

const medicineSuggestions = [
  { name: "Metformin", dosage: "500 mg", frequency: "Twice daily" },
  { name: "Amlodipine", dosage: "5 mg", frequency: "Once daily" },
  { name: "Atorvastatin", dosage: "20 mg", frequency: "At night" },
  { name: "Metoprolol", dosage: "25 mg", frequency: "Once daily" },
  { name: "Telmisartan", dosage: "40 mg", frequency: "Once daily" },
  { name: "Aspirin", dosage: "75 mg", frequency: "Once daily" },
];

const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export function OnboardingPage() {
  const [step, setStep] = useState<Step>("profile");

  const [profile, setProfile] = useState({ first_name: "", last_name: "", email: "", date_of_birth: "", blood_group: "" });
  const [medical, setMedical] = useState({ medical_conditions: "", allergies: "" });
  const [medicines, setMedicines] = useState<DraftMedicine[]>([]);
  const [draftMed, setDraftMed] = useState({ name: "", dosage: "", frequency: "" });
  const [goals, setGoals] = useState<string[]>(["Walk daily", "Take medicines on time"]);

  const [sending, setSending] = useState(false);
  const [invitedParentId, setInvitedParentId] = useState<string | null>(null);
  const [invitedEmail, setInvitedEmail] = useState("");
  const [devCode, setDevCode] = useState<string | undefined>(undefined);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [siblingEmail, setSiblingEmail] = useState("");
  const [siblings, setSiblings] = useState<string[]>([]);
  const inviteSibling = useInviteSibling();

  const sendInvitation = async () => {
    setSending(true);
    try {
      const res = await familiesApi.inviteParent({
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        date_of_birth: profile.date_of_birth,
        medical_conditions: medical.medical_conditions,
        allergies: medical.allergies,
        blood_group: profile.blood_group,
        goals,
      });
      setInvitedParentId(res.parent.id);
      setInvitedEmail(profile.email);
      setDevCode(res.dev_code);
      setStep("otp");
      if (res.dev_code) toast.info(`Dev mode — invite code is ${res.dev_code}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to send invitation");
    } finally {
      setSending(false);
    }
  };

  const acceptInvite = async () => {
    setVerifying(true);
    setOtpError(false);
    try {
      await familiesApi.acceptParentInvite({ email: invitedEmail, code: otp });
      setStep("done");
      toast.success("Parent added to your family circle.");
    } catch (err) {
      setOtpError(true);
      toast.error(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setVerifying(false);
    }
  };

  const resendCode = async () => {
    if (!invitedParentId) return;
    try {
      const res = await familiesApi.resendParentInvite(invitedParentId);
      setOtp("");
      if (res.dev_code) {
        setDevCode(res.dev_code);
        toast.info(`Dev mode — new code is ${res.dev_code}`);
      } else toast.success("A new code has been sent.");
    } catch {
      toast.error("Unable to resend code");
    }
  };

  const addSibling = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(siblingEmail)) {
      toast.error("Enter a valid email address");
      return;
    }
    try {
      await inviteSibling.mutateAsync(siblingEmail);
      setSiblings((s) => [...s, siblingEmail]);
      setSiblingEmail("");
      toast.success(`Invitation sent to ${siblingEmail}`);
    } catch {
      toast.error("Unable to invite sibling");
    }
  };

  const canProceed = () => {
    switch (step) {
      case "profile":
        return profile.first_name.length >= 2 && profile.last_name.length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email) && profile.date_of_birth.length === 10;
      case "medical":
        return medical.medical_conditions.trim().length > 0;
      case "medicines":
        return true;
      case "review":
        return true;
      default:
        return true;
    }
  };

  const next = () => {
    if (step === "profile") setStep("medical");
    else if (step === "medical") setStep("medicines");
    else if (step === "medicines") setStep("review");
    else if (step === "review") void sendInvitation();
  };

  const back = () => {
    if (step === "medical") setStep("profile");
    else if (step === "medicines") setStep("medical");
    else if (step === "review") setStep("medicines");
  };

  return (
    <div className="mx-auto max-w-3xl">
      {step !== "done" && (
        <PageHeader
          eyebrow="Family setup"
          title="Add your parent"
          description="Tell us about your parent so their personalized care can begin right away."
        />
      )}

      {step !== "done" && (
        <div className="mb-8 rounded-2xl border border-border/50 bg-card/60 p-4 sm:p-5 shadow-soft-sm backdrop-blur-md">
          <ProgressIndicator
            steps={[
              { label: "Profile", description: "Parent details" },
              { label: "Medical", description: "Conditions & vitals" },
              { label: "Medicines", description: "Daily schedule" },
              { label: "Review", description: "Confirm information" },
              { label: "Verify", description: "Activation code" },
            ]}
            currentStepIndex={stepMeta[step].index - 1}
            onStepClick={(targetIdx) => {
              const keys: Step[] = ["profile", "medical", "medicines", "review", "otp"];
              if (targetIdx < stepMeta[step].index - 1 && step !== "otp") {
                setStep(keys[targetIdx]);
              }
            }}
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          {step === "profile" && (
            <Card>
              <CardContent className="space-y-5 p-6 sm:p-8">
                <div>
                  <h3 className="font-heading text-lg font-semibold">Who are we setting up?</h3>
                  <p className="mt-1 text-sm text-muted-foreground">This is the parent you'll be caring for.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="parent-first-name">First name</Label>
                    <Input id="parent-first-name" value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} placeholder="Carol" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parent-last-name">Last name</Label>
                    <Input id="parent-last-name" value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} placeholder="Morgan" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent-email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="parent-email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder="parent@example.com" className="pl-10" type="email" />
                  </div>
                  <p className="text-xs text-muted-foreground">A secure invite code will be sent to this address.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="parent-dob">Date of birth</Label>
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="parent-dob" value={profile.date_of_birth} onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })} placeholder="1956-03-12" className="pl-10" type="date" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parent-blood-group">Blood group (optional)</Label>
                    <Select value={profile.blood_group || undefined} onValueChange={(v) => setProfile({ ...profile, blood_group: v })}>
                      <SelectTrigger id="parent-blood-group">
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        {bloodGroups.map((bg) => (
                          <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "medical" && (
            <Card>
              <CardContent className="space-y-5 p-6 sm:p-8">
                <div className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Medical details are required before the invitation is sent. They help the AI coach give
                    safe, personalized guidance and keep the care team informed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medical-conditions">Medical conditions</Label>
                  <Textarea
                    id="medical-conditions"
                    value={medical.medical_conditions}
                    onChange={(e) => setMedical({ ...medical, medical_conditions: e.target.value })}
                    placeholder={"e.g.\nType 2 Diabetes\nHypertension\nMild osteoarthritis in right knee"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medical-allergies">Allergies</Label>
                  <Textarea
                    id="medical-allergies"
                    value={medical.allergies}
                    onChange={(e) => setMedical({ ...medical, allergies: e.target.value })}
                    placeholder={"e.g.\nPenicillin\nShellfish"}
                  />
                </div>
                <div className="space-y-2">
                   <Label id="care-goals-label">Care goals (optional)</Label>
                   <div className="flex flex-wrap gap-2" role="group" aria-labelledby="care-goals-label">
                    {goals.map((g) => (
                      <Badge key={g} variant="outline" className="gap-1.5 py-1.5 pl-3 pr-2 text-xs">
                        {g}
                        <button type="button" onClick={() => setGoals(goals.filter((x) => x !== g))} className="flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/20" aria-label={`Remove ${g}`}>
                          ×
                        </button>
                      </Badge>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const goal = window.prompt("Add a care goal");
                        if (goal && goal.trim()) setGoals((g) => [...g, goal.trim()]);
                      }}
                      className="inline-flex min-h-9 items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                    >
                      <Plus className="h-3 w-3" /> Add goal
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "medicines" && (
            <Card>
              <CardContent className="space-y-5 p-6 sm:p-8">
                <div>
                  <h3 className="font-heading text-lg font-semibold">Regular medicines</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Add the medicines your parent takes regularly. You can change these anytime.</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input aria-label="Medicine name" placeholder="Medicine name" className="min-w-0 flex-1" value={draftMed.name} onChange={(e) => setDraftMed({ ...draftMed, name: e.target.value })} />
                  <div className="grid shrink-0 grid-cols-2 gap-3 sm:flex">
                    <Input aria-label="Dosage" placeholder="Dosage" value={draftMed.dosage} onChange={(e) => setDraftMed({ ...draftMed, dosage: e.target.value })} className="sm:w-32" />
                    <Input aria-label="Frequency" placeholder="Frequency" value={draftMed.frequency} onChange={(e) => setDraftMed({ ...draftMed, frequency: e.target.value })} className="sm:w-36" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => {
                      if (!draftMed.name.trim()) return;
                      setMedicines((m) => [...m, { id: `m-${Date.now()}`, name: draftMed.name.trim(), dosage: draftMed.dosage.trim(), frequency: draftMed.frequency.trim() }]);
                      setDraftMed({ name: "", dosage: "", frequency: "" });
                    }}
                  >
                    <Plus /> Add
                  </Button>
                </div>

                {medicines.length > 0 && (
                  <div className="space-y-2">
                    {medicines.map((med) => (
                      <motion.div
                        key={med.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/80 p-3.5"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Pill className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{med.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{med.dosage} · {med.frequency}</p>
                        </div>
                        <button type="button" onClick={() => setMedicines(medicines.filter((m) => m.id !== med.id))} className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-destructive/15" aria-label={`Remove ${med.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div>
                  <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Common medicines</p>
                  <div className="flex flex-wrap gap-2">
                    {medicineSuggestions.map((s) => {
                      const added = medicines.some((m) => m.name === s.name);
                      return (
                        <button
                          key={s.name}
                          disabled={added}
                          onClick={() => setMedicines((m) => [...m, { id: `m-${Date.now()}-${s.name}`, ...s }])}
                          className={cn(
                            "min-h-9 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
                            added ? "cursor-default border-primary/30 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary",
                          )}
                        >
                          {added ? <Check className="mr-1 inline h-3 w-3" /> : null}
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "review" && (
            <Card>
              <CardContent className="space-y-6 p-6 sm:p-8">
                <div>
                  <h3 className="font-heading text-lg font-semibold">Review & send invitation</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Once sent, {profile.first_name} will receive a secure code by email to join your family circle.</p>
                </div>
                <div className="overflow-hidden rounded-2xl border border-border/70">
                  <div className="flex items-center gap-3 border-b border-border/70 bg-muted/40 p-4">
                     <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <Heart className="h-5 w-5" />
                    </div>
                    <div>
                       <p className="font-heading text-base font-semibold text-foreground">{profile.first_name} {profile.last_name}</p>
                      <p className="text-xs text-muted-foreground">{profile.email} · Born {profile.date_of_birth}</p>
                    </div>
                  </div>
                  <div className="space-y-3 p-4 text-sm">
                    <ReviewRow label="Medical conditions" value={medical.medical_conditions.split("\n").filter(Boolean).join(", ")} />
                    <ReviewRow label="Allergies" value={medical.allergies || "None reported"} />
                    <ReviewRow label="Blood group" value={profile.blood_group || "—"} />
                    <ReviewRow label="Medicines" value={medicines.length ? medicines.map((m) => `${m.name} ${m.dosage}`).join(", ") : "None added"} />
                    <ReviewRow label="Care goals" value={goals.join(", ")} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "otp" && (
            <Card>
              <CardContent className="space-y-6 p-6 text-center sm:p-10">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/10">
                  <Mail className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-semibold tracking-[-0.025em]">Invitation sent to {profile.first_name}</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    We emailed a 6-digit code to <span className="font-semibold text-foreground">{invitedEmail}</span>.
                    Enter it here to activate their profile. They can also enter it from their own device.
                  </p>
                </div>
                {devCode && (
                  <div className="mx-auto w-fit rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-2">
                    <p className="text-xs font-semibold text-primary">DEV MODE — the code is</p>
                    <p className="font-metric text-2xl font-bold tracking-[0.3em] text-foreground">{devCode}</p>
                  </div>
                )}
                <div>
                  <OtpInput length={6} value={otp} onChange={setOtp} error={otpError} />
                  {otpError && <p role="alert" className="mt-2 text-xs font-medium text-destructive">That code could not be verified.</p>}
                </div>
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={acceptInvite}
                  disabled={otp.length !== 6 || verifying}
                  isLoading={verifying}
                  loadingText="Verifying code…"
                  icon={<CheckCircle2 className="h-4 w-4" />}
                >
                  Activate parent profile
                </Button>
                <button type="button" onClick={resendCode} className="mx-auto block min-h-10 rounded-lg px-3 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15">
                  Resend the code
                </button>
              </CardContent>
            </Card>
          )}

          {step === "done" && (
            <Card className="overflow-hidden">
              <CardContent className="p-8 text-center sm:p-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.1 }}
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-mint-lg"
                >
                  <PartyPopper className="h-9 w-9" />
                </motion.div>
                <h2 className="font-heading text-2xl font-semibold tracking-[-0.025em]">Welcome, {profile.first_name}!</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                  {profile.first_name} is now part of your family circle. Their care profile, medicines, and
                  check-in reminders are all set up.
                </p>

                <div className="mx-auto mt-8 grid max-w-md gap-3 text-left">
                  <SuccessItem icon={HeartPulse} title="Care profile created" text="Medical conditions, allergies and goals saved" />
                  <SuccessItem icon={Pill} title="Medicines registered" text={`${medicines.length} medicine${medicines.length === 1 ? "" : "s"} tracked with reminders`} />
                  <SuccessItem icon={Mail} title="Daily check-ins active" text="Morning, afternoon and evening check-in windows" />
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {step !== "done" && (
        <div className="mt-8 flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/75 p-2 shadow-soft-sm backdrop-blur-xl">
          <Button variant="ghost" onClick={back} disabled={step === "profile" || sending} className="text-muted-foreground">
            <ArrowLeft /> Back
          </Button>
          <Button
            onClick={next}
            disabled={!canProceed() || sending}
            isLoading={step === "review" && sending}
            loadingText="Sending invitation…"
            size="lg"
          >
            {step === "review" ? "Send invitation" : "Continue"}
            {step !== "review" && <ArrowRight />}
          </Button>
        </div>
      )}

      {step === "done" && (
        <div className="mt-10 space-y-6">
          <Card>
            <CardContent className="p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-heading text-base font-bold">Invite siblings to the care circle</h3>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Siblings can see health updates, join the family quiz, and receive alerts. Everyone cares together.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={siblingEmail} onChange={(e) => setSiblingEmail(e.target.value)} placeholder="sibling@example.com" className="pl-10" type="email" />
                </div>
                <Button
                  variant="outline"
                  onClick={addSibling}
                  disabled={inviteSibling.isPending}
                  isLoading={inviteSibling.isPending}
                  loadingText="Inviting…"
                  icon={<UserPlus />}
                >
                  Invite sibling
                </Button>
              </div>
              {siblings.length > 0 && (
                <div className="mt-4 space-y-2">
                  {siblings.map((email) => (
                    <div key={email} className="flex items-center gap-3 rounded-2xl bg-muted/50 px-4 py-3 text-sm">
                      <Check className="h-4 w-4 text-secondary" />
                      <span className="font-medium text-foreground">{email}</span>
                      <Badge variant="muted" className="ml-auto">Invited</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button asChild size="lg">
              <Link to="/" onClick={() => toast.success("Your family circle is ready")}>
                Go to dashboard <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
      <span className="w-32 shrink-0 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 break-words text-foreground">{value}</span>
    </div>
  );
}

function SuccessItem({ icon: Icon, title, text }: { icon: typeof HeartPulse; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3.5 rounded-xl border border-border/70 bg-card/70 p-4">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
