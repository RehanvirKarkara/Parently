import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import * as authApi from "@/api/auth";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { OtpInput } from "@/components/shared/OtpInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onRequest = async (values: FormValues) => {
    setSending(true);
    try {
      const res = await authApi.requestPasswordReset(values.email);
      setEmail(values.email);
      setSent(true);
      if (res.dev_code) toast.info(`Dev mode — your code is ${res.dev_code}`);
      else toast.success("If an account exists, a reset code has been sent.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const onVerify = async () => {
    setVerifying(true);
    setOtpError(false);
    try {
      await authApi.verifyOtp({ email, code: otp, purpose: "password_reset" });
      navigate("/reset-password", { state: { email, code: otp } });
    } catch (err) {
      setOtpError(true);
      toast.error(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    setSending(true);
    try {
      const res = await authApi.requestPasswordReset(email);
      setOtp("");
      if (res.dev_code) toast.info(`Dev mode — your code is ${res.dev_code}`);
      else toast.success("A new code has been sent.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthLayout>
      <Link to="/login" className="mb-6 inline-flex min-h-10 items-center gap-1.5 rounded-lg text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15">
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </Link>

      {!sent ? (
        <>
          <div className="mb-8">
            <h1 className="font-heading text-2xl font-semibold leading-tight text-foreground">Forgot your password?</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Enter your account email and we'll send a one-time code to reset your password.
            </p>
          </div>
          <form onSubmit={handleSubmit(onRequest)} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "reset-email-error" : undefined}
                  {...register("email")}
                />
              </div>
              {errors.email && <p id="reset-email-error" role="alert" className="text-xs font-medium text-destructive">{errors.email.message}</p>}
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={sending} aria-busy={sending}>
              {sending && <Loader2 className="h-4 w-4 animate-spin" />}
              {sending ? "Sending…" : "Send reset code"}
            </Button>
          </form>
        </>
      ) : (
        <div className="animate-fade-up">
          <div className="mb-8">
            <h1 className="font-heading text-2xl font-semibold leading-tight text-foreground">Check your email</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              We sent a 6-digit code to <span className="font-semibold text-foreground">{email}</span>. Enter it below to continue.
            </p>
          </div>
          <div className="space-y-5">
            <div>
              <OtpInput length={6} value={otp} onChange={setOtp} error={otpError} />
              {otpError && <p role="alert" className="mt-2 text-center text-xs font-medium text-destructive">That code could not be verified.</p>}
            </div>
            <Button className="w-full" size="lg" onClick={onVerify} disabled={otp.length !== 6 || verifying} aria-busy={verifying}>
              {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
              {verifying ? "Verifying…" : "Verify code"}
            </Button>
            <button
              type="button"
              onClick={resend}
              disabled={sending}
              className="min-h-10 w-full rounded-lg text-center text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:opacity-50"
            >
              {sending ? "Resending…" : "Didn't get it? Resend"}
            </button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
