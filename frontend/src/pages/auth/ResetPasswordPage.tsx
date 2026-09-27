import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import * as authApi from "@/api/auth";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z
  .object({
    new_password: z.string().min(8, "Use at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, { message: "Passwords don't match", path: ["confirm_password"] });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { email?: string; code?: string } | null;
  const email = state?.email ?? "";
  const code = state?.code ?? "";
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    if (!email || !code) {
      toast.error("Session expired or verification code missing. Please start over.");
      navigate("/forgot-password");
      return;
    }
    setSubmitting(true);
    try {
      await authApi.resetPassword({ email, code, new_password: values.new_password });
      setDone(true);
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to reset password");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center py-10 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10 text-secondary ring-1 ring-inset ring-secondary/15">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.025em]">Password updated</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your password has been reset. Redirecting you to sign in…</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold leading-tight text-foreground">Set a new password</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">For <span className="font-semibold text-foreground">{email || "your account"}</span></p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="new_password">New password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="new_password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              className="pl-10 pr-12"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.new_password)}
              aria-describedby={errors.new_password ? "new-password-error" : undefined}
              {...register("new_password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.new_password && <p id="new-password-error" role="alert" className="text-xs font-medium text-destructive">{errors.new_password.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirm new password</Label>
          <Input
            type="password"
            placeholder="Repeat new password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirm_password)}
            aria-describedby={errors.confirm_password ? "confirm-password-error" : undefined}
            {...register("confirm_password")}
          />
          {errors.confirm_password && <p id="confirm-password-error" role="alert" className="text-xs font-medium text-destructive">{errors.confirm_password.message}</p>}
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={submitting} aria-busy={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Updating…" : "Update password"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-semibold text-primary hover:underline">Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}
