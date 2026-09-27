import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as familiesApi from "@/api/families";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { OtpInput } from "@/components/shared/OtpInput";
import { useAuthStore } from "@/stores/authStore";

export function ParentActivatePage() {
  const navigate = useNavigate();
  const { mode, parent, parentId } = useAuthStore();
  const activate = useAuthStore((s) => s.activateParentInvite);

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const email = parent?.email ?? "";

  if (mode !== "parent") return <Navigate to="/login" replace />;
  if (parent && parent.is_active) return <Navigate to="/parent" replace />;

  const activateInvite = async () => {
    setVerifying(true);
    setOtpError(false);
    try {
      await activate(otp);
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
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-[460px]">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <Card>
          <CardContent className="space-y-6 p-6 text-center sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-inset ring-accent/15">
              <Mail className="h-7 w-7" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-semibold leading-tight text-foreground">Verify your invitation</h1>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                We emailed a 6-digit code to <span className="font-semibold text-foreground">{email}</span>. Enter it below to join your family circle.
              </p>
            </div>
            <div>
              <OtpInput length={6} value={otp} onChange={setOtp} error={otpError} />
              {otpError && <p role="alert" className="mt-2 text-center text-xs font-medium text-destructive">That code could not be verified.</p>}
            </div>
            <Button size="lg" className="w-full sm:w-auto" onClick={activateInvite} disabled={otp.length !== 6 || verifying} aria-busy={verifying}>
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {verifying ? "Verifying…" : "Join my family circle"}
            </Button>
            <button onClick={resendCode} disabled={resending} className="mx-auto block min-h-10 rounded-lg px-3 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:opacity-50">
              {resending ? "Sending a new code…" : "Resend the code"}
            </button>
            <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/40 p-3.5 text-left">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Your account stays locked until your family confirms this invitation. Codes expire after a short time.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Using a different account?{" "}
          <button onClick={() => useAuthStore.getState().logout()} className="rounded font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15">
            Sign out
          </button>
        </p>
      </motion.div>
    </main>
  );
}