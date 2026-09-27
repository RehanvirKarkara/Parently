import { motion } from "framer-motion";
import { CheckCircle2, ChevronDown, ChevronUp, Eye, Loader2, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as familiesApi from "@/api/families";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { OtpInput } from "@/components/shared/OtpInput";
import { useAuthStore } from "@/stores/authStore";

const AVAILABLE_SCOPES = [
  { id: "checkins", label: "Daily Check-Ins", desc: "Sleep duration, mood, and meals logged" },
  { id: "medications", label: "Medication Adherence", desc: "Medication list and reminder confirmations" },
  { id: "vitals", label: "Health Logs & Vitals", desc: "Step counts, physical notes, and vitals" },
  { id: "reports", label: "Care Reports", desc: "Weekly health digests and progress overviews" },
  { id: "ai_summaries", label: "AI Wellness Suggestions", desc: "Contextual tips and conversation summaries" },
];

export function ParentActivatePage() {
  const navigate = useNavigate();
  const { mode, parent, parentId } = useAuthStore();
  const activate = useAuthStore((s) => s.activateParentInvite);

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  // Granular data authorization & consent state
  const [showPermissions, setShowPermissions] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    "checkins",
    "medications",
    "vitals",
    "reports",
    "ai_summaries",
  ]);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [agreePrivacy, setAgreePrivacy] = useState(true);

  const email = parent?.email ?? "";

  if (mode !== "parent") return <Navigate to="/login" replace />;
  if (parent && parent.is_active) return <Navigate to="/parent" replace />;

  const toggleScope = (scopeId: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scopeId) ? prev.filter((s) => s !== scopeId) : [...prev, scopeId]
    );
  };

  const activateInvite = async () => {
    if (!agreeTerms || !agreePrivacy) {
      toast.error("Please accept the Terms of Service and Privacy Policy to continue.");
      return;
    }
    setVerifying(true);
    setOtpError(false);
    try {
      await activate(otp, selectedScopes, agreeTerms, agreePrivacy);
      toast.success("Welcome to your family circle!");
      navigate("/parent", { replace: true });
    } catch (err) {
      setOtpError(true);
      toast.error(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setVerifying(false);
    }
  };

  const resendCode = async () => {
    if (!parentId) return;
    setResending(true);
    try {
      const res = await familiesApi.resendParentInvite(parentId);
      setOtp("");
      if (res.dev_code) toast.info(`Dev mode — new code is ${res.dev_code}`);
      else toast.success("A new code has been sent.");
    } catch {
      toast.error("Unable to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center overflow-y-auto bg-background bg-mesh-primary px-4 py-10 pt-[calc(env(safe-area-inset-top)+2.5rem)] sm:py-14">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[500px]"
      >
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <Card className="border-border/60 shadow-soft backdrop-blur-md">
          <CardContent className="space-y-6 p-6 sm:p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-inset ring-accent/15">
              <Mail className="h-7 w-7" />
            </div>

            <div>
              <h1 className="font-heading text-2xl font-semibold leading-tight text-foreground">
                Join your family circle
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Enter the 6-digit verification code emailed to{" "}
                <span className="font-semibold text-foreground">{email}</span>.
              </p>
            </div>

            <div>
              <OtpInput length={6} value={otp} onChange={setOtp} error={otpError} />
              {otpError && (
                <p role="alert" className="mt-2 text-center text-xs font-medium text-destructive">
                  That code could not be verified. Please try again.
                </p>
              )}
            </div>

            {/* Transparent Data Sharing Permissions Card */}
            <div className="rounded-xl border border-border/70 bg-card/60 p-4 text-left space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Eye className="w-4 h-4 text-primary" />
                  <span>Data Sharing Authorization</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPermissions(!showPermissions)}
                  className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                >
                  {showPermissions ? "Hide Details" : "Customize"}
                  {showPermissions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              <p className="text-xs text-muted-foreground leading-normal">
                Your family members will only receive access to the records you authorize. You remain in control and can update or revoke access at any time in Settings.
              </p>

              {showPermissions && (
                <div className="space-y-2 pt-2 border-t border-border/40 text-xs">
                  {AVAILABLE_SCOPES.map((scope) => (
                    <label
                      key={scope.id}
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/40 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(scope.id)}
                        onChange={() => toggleScope(scope.id)}
                        className="mt-0.5 rounded border-border text-primary focus:ring-primary/20"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{scope.label}</div>
                        <div className="text-[11px] text-muted-foreground">{scope.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Legal Consent Checkboxes */}
            <div className="space-y-2.5 text-left text-xs text-muted-foreground">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-border text-primary focus:ring-primary/20"
                />
                <span>
                  I agree to the{" "}
                  <Link to="/terms" target="_blank" className="font-semibold underline text-foreground hover:text-primary">
                    Terms of Service
                  </Link>{" "}
                  and acknowledge the{" "}
                  <Link to="/medical-disclaimer" target="_blank" className="font-semibold underline text-foreground hover:text-primary">
                    Medical Disclaimer
                  </Link>.
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="mt-0.5 rounded border-border text-primary focus:ring-primary/20"
                />
                <span>
                  I acknowledge the{" "}
                  <Link to="/privacy-policy" target="_blank" className="font-semibold underline text-foreground hover:text-primary">
                    Privacy Policy
                  </Link>{" "}
                  and consent to care coordination data processing.
                </span>
              </label>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={activateInvite}
              disabled={otp.length !== 6 || verifying || !agreeTerms || !agreePrivacy}
              aria-busy={verifying}
            >
              {verifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              {verifying ? "Verifying…" : "Authorize & Join Family"}
            </Button>

            <button
              onClick={resendCode}
              disabled={resending}
              className="mx-auto block min-h-10 rounded-lg px-3 text-sm font-semibold text-primary hover:underline focus-visible:outline-none disabled:opacity-50"
            >
              {resending ? "Sending a new code…" : "Resend verification code"}
            </button>

            <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/40 p-3.5 text-left">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Your data is strictly encrypted in transit. Family members can only access the categories you authorize above.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Using a different account?{" "}
          <button
            onClick={() => useAuthStore.getState().logout()}
            className="rounded font-semibold text-primary hover:underline focus-visible:outline-none"
          >
            Sign out
          </button>
        </p>
      </motion.div>
    </main>
  );
}