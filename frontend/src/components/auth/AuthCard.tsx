import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Pill,
  ShieldCheck,
  User,
  UserCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { setTokens } from "@/api/client";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister } from "@/hooks/queries";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import logoUrl from "@/assets/logo.png";

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const registerSchema = (isParent: boolean) =>
  z
    .object({
      first_name: z.string().refine((v) => isParent || v.trim().length >= 2, {
        message: "Enter your first name",
      }),
      last_name: z.string().refine((v) => isParent || v.trim().length >= 2, {
        message: "Enter your last name",
      }),
      email: z.string().email("Enter a valid email address"),
      password: z.string().min(8, "Use at least 8 characters"),
      confirm_password: z.string(),
    })
    .refine((data) => data.password === data.confirm_password, {
      message: "Passwords don't match",
      path: ["confirm_password"],
    });

type RegisterFormValues = z.infer<ReturnType<typeof registerSchema>>;

interface AuthCardProps {
  initialMode?: "login" | "register";
}

export function AuthCard({ initialMode = "login" }: AuthCardProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") ?? "child";
  const isParent = role === "parent";

  // Synchronize internal state if initialMode prop changes (e.g. browser navigation)
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Login form state & submission
  const login = useAuthStore((s) => s.login);
  const [loginShowPassword, setLoginShowPassword] = useState(false);
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Register form state & submission
  const registerUser = useRegister();
  const registerParent = useAuthStore((s) => s.registerParent);
  const [registerShowPassword, setRegisterShowPassword] = useState(false);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema(isParent)),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  const handleModeSwitch = (newMode: "login" | "register") => {
    if (newMode === mode) return;
    setMode(newMode);
    const targetUrl = isParent ? `/${newMode}?role=parent` : `/${newMode}`;
    navigate(targetUrl, { replace: true });
  };

  const toggleRole = () => {
    const nextRole = isParent ? "child" : "parent";
    const targetUrl = nextRole === "parent" ? `/${mode}?role=parent` : `/${mode}`;
    navigate(targetUrl, { replace: true });
  };

  const onLoginSubmit = async (values: LoginFormValues) => {
    setLoginSubmitting(true);
    try {
      await login(values.email, values.password);
      const { mode: authMode, parent } = useAuthStore.getState();
      const needsActivation = authMode === "parent" && parent && !parent.is_active;
      toast.success(authMode === "parent" ? "Welcome back!" : "Welcome back, nice to see you.");
      navigate(needsActivation ? "/parent/activate" : authMode === "parent" ? "/parent" : "/", {
        replace: true,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setLoginSubmitting(false);
    }
  };

  const onRegisterSubmit = async (values: RegisterFormValues) => {
    setRegisterSubmitting(true);
    try {
      if (isParent) {
        await registerParent({ email: values.email, password: values.password });
        toast.success("Account created. Check your email for the invitation code.");
        navigate("/parent/activate", { replace: true });
        return;
      }
      const res = await registerUser.mutateAsync({
        email: values.email,
        password: values.password,
        first_name: values.first_name,
        last_name: values.last_name,
      });
      setTokens(res.tokens.access_token, res.tokens.refresh_token);
      useAuthStore.setState({ user: res.user, mode: "offspring", status: "authenticated" });
      toast.success("Account created. Welcome to Parently!");
      navigate("/onboarding", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to create account");
    } finally {
      setRegisterSubmitting(false);
    }
  };

  const fillDemo = (email: string) => {
    loginForm.setValue("email", email, { shouldValidate: true });
    loginForm.setValue("password", "password123", { shouldValidate: true });
  };

  const isLogin = mode === "login";

  return (
    <div className="relative flex min-h-dvh items-center justify-center p-4 sm:p-6 lg:p-8 bg-background overflow-hidden selection:bg-primary/20">
      {/* Background atmospheric ambient gradients */}
      <div
        className="pointer-events-none absolute -top-48 -left-48 h-[600px] w-[600px] rounded-full bg-primary/12 blur-[130px] dark:bg-primary/20"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-48 -right-48 h-[600px] w-[600px] rounded-full bg-secondary-accent/18 blur-[130px] dark:bg-secondary-accent/15"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.05)_0%,transparent_70%)] blur-2xl"
        aria-hidden="true"
      />

      {/* Main Split-Screen Authentication Container */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[1080px] min-h-[660px] overflow-hidden rounded-[2.5rem] border border-white/80 dark:border-white/10 bg-card/90 dark:bg-slate-900/90 backdrop-blur-3xl shadow-[0_32px_80px_-16px_rgba(15,23,42,0.12),0_12px_32px_-6px_rgba(124,58,237,0.12),inset_0_1px_2px_rgba(255,255,255,0.9)]"
      >
        {/* ========================================================================= */}
        {/* DESKTOP & TABLET: Animated Sliding Split-Screen View (hidden on mobile)   */}
        {/* ========================================================================= */}
        <div className="hidden lg:block relative w-full min-h-[660px]">
          {/* Base Form Layer: Left half is Sign In, Right half is Sign Up */}
          <div className="grid grid-cols-2 w-full min-h-[660px]">
            {/* ----------------- LEFT 50%: SIGN IN FORM ----------------- */}
            <div
              className={cn(
                "p-10 xl:p-12 flex flex-col justify-between transition-all duration-500",
                isLogin ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none select-none",
              )}
            >
              <div>
                {/* Top Row: Portal Role Switcher & Branding link */}
                <div className="flex items-center justify-between gap-3 mb-6">
                  <Link to="/login" className="inline-flex items-center gap-2 focus-visible:outline-none">
                    <Logo size="sm" />
                  </Link>

                  <button
                    type="button"
                    onClick={toggleRole}
                    className="group inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs font-semibold text-foreground shadow-soft-xs transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full transition-colors",
                        isParent ? "bg-accent" : "bg-primary",
                      )}
                    />
                    <span>{isParent ? "Parent Space" : "Caregiver / Child"}</span>
                    <span className="text-[10px] text-muted-foreground group-hover:text-primary">
                      (Switch)
                    </span>
                  </button>
                </div>

                {isParent && (
                  <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-accent/20 bg-accent/8 p-3 text-xs text-foreground/90">
                    <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <p className="leading-relaxed">
                      <span className="font-semibold text-accent">Parent Portal:</span> Sign in with the
                      email that received your invitation.
                    </p>
                  </div>
                )}

                {/* Heading & Subtitle */}
                <div className="mb-6">
                  <h1 className="font-heading text-2xl xl:text-3xl font-semibold leading-tight text-foreground tracking-[-0.03em]">
                    Welcome back to Parently
                  </h1>
                  <p className="mt-1.5 text-xs xl:text-sm text-muted-foreground leading-relaxed">
                    Continue caring for the people who matter most.
                  </p>
                </div>

                {/* Sign In Form */}
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <Label htmlFor="desktop-login-email" className="text-xs font-semibold text-foreground/90">
                      Email address
                    </Label>
                    <div className="relative group/field">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/field:text-primary" />
                      <Input
                        id="desktop-login-email"
                        type="email"
                        placeholder="you@example.com"
                        className="h-11 rounded-xl pl-10 bg-background/80 border-border/80 transition-all duration-200 focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:border-primary"
                        autoComplete="email"
                        aria-invalid={Boolean(loginForm.formState.errors.email)}
                        aria-describedby={loginForm.formState.errors.email ? "desktop-email-err" : undefined}
                        {...loginForm.register("email")}
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p id="desktop-email-err" role="alert" className="text-xs font-medium text-destructive">
                        {loginForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="desktop-login-password" className="text-xs font-semibold text-foreground/90">
                        Password
                      </Label>
                      <Link
                        to="/forgot-password"
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative group/field">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/field:text-primary" />
                      <Input
                        id="desktop-login-password"
                        type={loginShowPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="h-11 rounded-xl pl-10 pr-12 bg-background/80 border-border/80 transition-all duration-200 focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:border-primary"
                        autoComplete="current-password"
                        aria-invalid={Boolean(loginForm.formState.errors.password)}
                        aria-describedby={loginForm.formState.errors.password ? "desktop-pw-err" : undefined}
                        {...loginForm.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setLoginShowPassword((v) => !v)}
                        className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                        aria-label={loginShowPassword ? "Hide password" : "Show password"}
                      >
                        {loginShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p id="desktop-pw-err" role="alert" className="text-xs font-medium text-destructive">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-gradient-primary text-white font-semibold text-sm shadow-brand hover:shadow-brand-md active:scale-[0.985] transition-all"
                    disabled={loginSubmitting}
                    aria-busy={loginSubmitting}
                  >
                    {loginSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {loginSubmitting ? "Signing in…" : "Sign in to Parently"}
                    {!loginSubmitting && <ArrowRight className="h-4 w-4 ml-1.5" />}
                  </Button>
                </form>

                {/* Quick Demo Profiles */}
                <div className="pt-4">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="h-px flex-1 bg-border/70" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      Quick Demo Profiles
                    </span>
                    <div className="h-px flex-1 bg-border/70" />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <motion.button
                      type="button"
                      whileHover={{ y: -1.5 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => fillDemo("alex@parently.app")}
                      className="group flex flex-col justify-between rounded-xl border border-border/80 bg-background/70 p-2.5 text-left shadow-soft-xs transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          Offspring
                        </span>
                        <UserCheck className="h-3.5 w-3.5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <div className="mt-1">
                        <p className="text-xs font-semibold text-foreground">Alex Morgan</p>
                        <p className="text-[10px] text-muted-foreground truncate">alex@parently.app</p>
                      </div>
                    </motion.button>

                    <motion.button
                      type="button"
                      whileHover={{ y: -1.5 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => fillDemo("carol@parently.app")}
                      className="group flex flex-col justify-between rounded-xl border border-border/80 bg-background/70 p-2.5 text-left shadow-soft-xs transition-all duration-200 hover:border-accent/40 hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/15"
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                          Parent
                        </span>
                        <UserCheck className="h-3.5 w-3.5 text-accent opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <div className="mt-1">
                        <p className="text-xs font-semibold text-foreground">Carol Morgan</p>
                        <p className="text-[10px] text-muted-foreground truncate">carol@parently.app</p>
                      </div>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Bottom In-Form Switch Link */}
              <div className="pt-4 border-t border-border/60 text-xs text-muted-foreground text-center">
                <span>Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => handleModeSwitch("register")}
                  className="font-bold text-primary hover:underline focus-visible:outline-none"
                >
                  Create an account
                </button>
              </div>
            </div>

            {/* ----------------- RIGHT 50%: SIGN UP FORM ----------------- */}
            <div
              className={cn(
                "p-10 xl:p-12 flex flex-col justify-between transition-all duration-500",
                !isLogin ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none select-none",
              )}
            >
              <div>
                {/* Top Row: Portal Role Switcher & Branding link */}
                <div className="flex items-center justify-between gap-3 mb-5">
                  <Link to="/login" className="inline-flex items-center gap-2 focus-visible:outline-none">
                    <Logo size="sm" />
                  </Link>

                  <button
                    type="button"
                    onClick={toggleRole}
                    className="group inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs font-semibold text-foreground shadow-soft-xs transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full transition-colors",
                        isParent ? "bg-accent" : "bg-primary",
                      )}
                    />
                    <span>{isParent ? "Parent Space" : "Caregiver / Child"}</span>
                    <span className="text-[10px] text-muted-foreground group-hover:text-primary">
                      (Switch)
                    </span>
                  </button>
                </div>

                {isParent && (
                  <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-accent/20 bg-accent/8 p-3 text-xs text-foreground/90">
                    <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <p className="leading-relaxed">
                      <span className="font-semibold text-accent">Parent Portal:</span> Set your password
                      with the email address where your family sent your invitation.
                    </p>
                  </div>
                )}

                {/* Heading & Subtitle */}
                <div className="mb-5">
                  <h1 className="font-heading text-2xl xl:text-3xl font-semibold leading-tight text-foreground tracking-[-0.03em]">
                    {isParent ? "Join your family circle" : "Create your Parently account"}
                  </h1>
                  <p className="mt-1 text-xs xl:text-sm text-muted-foreground leading-relaxed">
                    Bring your family's care and wellbeing together in one place.
                  </p>
                </div>

                {/* Sign Up Form */}
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-3.5" noValidate>
                  {!isParent && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="desktop-reg-first-name" className="text-xs font-semibold text-foreground/90">
                          First name
                        </Label>
                        <div className="relative group/field">
                          <User className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/field:text-primary" />
                          <Input
                            id="desktop-reg-first-name"
                            placeholder="Alex"
                            className="h-10 rounded-xl pl-9 bg-background/80"
                            autoComplete="given-name"
                            {...registerForm.register("first_name")}
                          />
                        </div>
                        {registerForm.formState.errors.first_name && (
                          <p role="alert" className="text-[11px] font-medium text-destructive">
                            {registerForm.formState.errors.first_name.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="desktop-reg-last-name" className="text-xs font-semibold text-foreground/90">
                          Last name
                        </Label>
                        <Input
                          id="desktop-reg-last-name"
                          placeholder="Morgan"
                          className="h-10 rounded-xl bg-background/80"
                          autoComplete="family-name"
                          {...registerForm.register("last_name")}
                        />
                        {registerForm.formState.errors.last_name && (
                          <p role="alert" className="text-[11px] font-medium text-destructive">
                            {registerForm.formState.errors.last_name.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label htmlFor="desktop-reg-email" className="text-xs font-semibold text-foreground/90">
                      Email address
                    </Label>
                    <div className="relative group/field">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/field:text-primary" />
                      <Input
                        id="desktop-reg-email"
                        type="email"
                        placeholder="you@example.com"
                        className="h-10 rounded-xl pl-10 bg-background/80"
                        autoComplete="email"
                        {...registerForm.register("email")}
                      />
                    </div>
                    {registerForm.formState.errors.email && (
                      <p role="alert" className="text-[11px] font-medium text-destructive">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="desktop-reg-password" className="text-xs font-semibold text-foreground/90">
                        Password
                      </Label>
                      <div className="relative group/field">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/field:text-primary" />
                        <Input
                          id="desktop-reg-password"
                          type={registerShowPassword ? "text" : "password"}
                          placeholder="8+ chars"
                          className="h-10 rounded-xl pl-9 pr-8 text-xs bg-background/80"
                          autoComplete="new-password"
                          {...registerForm.register("password")}
                        />
                        <button
                          type="button"
                          onClick={() => setRegisterShowPassword((v) => !v)}
                          className="absolute right-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
                          aria-label={registerShowPassword ? "Hide password" : "Show password"}
                        >
                          {registerShowPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      {registerForm.formState.errors.password && (
                        <p role="alert" className="text-[11px] font-medium text-destructive">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="desktop-reg-confirm-password" className="text-xs font-semibold text-foreground/90">
                        Confirm password
                      </Label>
                      <Input
                        id="desktop-reg-confirm-password"
                        type="password"
                        placeholder="Repeat password"
                        className="h-10 rounded-xl text-xs bg-background/80"
                        autoComplete="new-password"
                        {...registerForm.register("confirm_password")}
                      />
                      {registerForm.formState.errors.confirm_password && (
                        <p role="alert" className="text-[11px] font-medium text-destructive">
                          {registerForm.formState.errors.confirm_password.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full h-11 rounded-xl bg-gradient-primary text-white font-semibold text-sm shadow-brand hover:shadow-brand-md active:scale-[0.985] transition-all"
                      disabled={registerSubmitting}
                      aria-busy={registerSubmitting}
                    >
                      {registerSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      {registerSubmitting
                        ? "Creating account…"
                        : isParent
                          ? "Join my family circle"
                          : "Create account"}
                      {!registerSubmitting && <ArrowRight className="h-4 w-4 ml-1.5" />}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Bottom In-Form Switch Link */}
              <div className="pt-4 border-t border-border/60 text-xs text-muted-foreground text-center">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => handleModeSwitch("login")}
                  className="font-bold text-primary hover:underline focus-visible:outline-none"
                >
                  Sign in
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* THE SLIDING BRANDING OVERLAY PANEL (Smoothly glides horizontally)          */}
          {/* ========================================================================= */}
          <motion.div
            initial={false}
            animate={{
              x: isLogin ? "100%" : "0%",
            }}
            transition={{
              duration: 0.65,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="absolute top-0 bottom-0 left-0 w-1/2 z-20 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
          >
            {/* Dark Twilight Canvas */}
            <div className="relative w-full h-full bg-gradient-to-br from-slate-950 via-[#13112c] to-[#1e1b4b] text-white p-10 xl:p-12 flex flex-col justify-between select-none">
              {/* Internal radiant atmospheric lights */}
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,hsl(245_84%_58%_/_0.38),transparent_55%),radial-gradient(circle_at_80%_80%,hsl(152_70%_34%_/_0.22),transparent_50%)]"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.035] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"
                aria-hidden="true"
              />

              {/* Top Branding Pill */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <Logo
                    size="sm"
                    className="[&_span]:text-white font-semibold"
                    markClassName="bg-white/12 ring-1 ring-white/20 p-1.5 rounded-xl backdrop-blur-md shadow-brand"
                  />
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-secondary-accent backdrop-blur-md ring-1 ring-white/15">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary-accent animate-pulse" />
                  {isLogin ? "Family Care" : "Family Circle"}
                </span>
              </div>

              {/* Middle: Luminous Parently Emblem & Live Care Indicators */}
              <div className="relative z-10 my-auto py-6 flex flex-col items-center justify-center text-center">
                {/* Floating Emblem Pedestal */}
                <div className="relative flex items-center justify-center mb-8">
                  {/* Subtle breathing glow */}
                  <motion.div
                    animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.6, 0.35] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -inset-4 rounded-full bg-primary/25 blur-2xl pointer-events-none"
                  />

                  {/* Luminous Emblem Container */}
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                    className="relative flex h-32 w-32 items-center justify-center rounded-[2rem] border border-white/20 bg-white/10 p-4 shadow-[0_20px_45px_rgba(0,0,0,0.4)] backdrop-blur-xl ring-1 ring-white/25"
                  >
                    <img
                      src={logoUrl}
                      alt="Parently"
                      className="h-full w-full object-contain drop-shadow-[0_8px_24px_rgba(124,58,237,0.5)] pointer-events-none"
                    />
                  </motion.div>

                  {/* Floating Telemetry Badge 1: Check-ins */}
                  <motion.div
                    animate={{ y: [-3, 3, -3], x: [0, 2, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-3 -right-8 flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-1.5 shadow-lg backdrop-blur-xl ring-1 ring-white/20"
                  >
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
                    <div className="text-left">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-300">
                        Check-in
                      </p>
                      <p className="text-[11px] font-medium text-white/95">Mom logged: Well</p>
                    </div>
                  </motion.div>

                  {/* Floating Telemetry Badge 2: Medication */}
                  <motion.div
                    animate={{ y: [3, -3, 3], x: [0, -2, 0] }}
                    transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -bottom-3 -left-8 flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-1.5 shadow-lg backdrop-blur-xl ring-1 ring-white/20"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/30 text-secondary-accent">
                      <Pill className="h-3 w-3" />
                    </div>
                    <div className="text-left">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-secondary-accent">
                        Medications
                      </p>
                      <p className="text-[11px] font-medium text-white/95">On track · 100%</p>
                    </div>
                  </motion.div>
                </div>

                {/* Animated Morphing Copy */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mode}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-xs"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary-accent">
                      {isLogin ? "Care that stays connected" : "Peace of mind"}
                    </p>
                    <h2 className="mt-2 font-heading text-2xl font-semibold leading-tight text-white tracking-[-0.02em]">
                      {isLogin ? "Better care. Stronger connections." : "Everyday care, made human."}
                    </h2>
                    <p className="mt-2.5 text-xs text-white/70 leading-relaxed">
                      {isLogin
                        ? "A calm, shared place for daily health checks, medication reminders, and family reassurance."
                        : "Coordinate daily care across generations. Simple check-ins, medication schedules, and proactive AI alerts."}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Primary Sliding CTA Trigger Button */}
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="mt-6">
                  <button
                    type="button"
                    onClick={() => handleModeSwitch(isLogin ? "register" : "login")}
                    className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-6 py-2.5 text-xs font-semibold text-white shadow-soft-sm backdrop-blur-md transition-all hover:border-white/40 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
                  >
                    <span>{isLogin ? "New to Parently? Create an account" : "Already a member? Sign in"}</span>
                    {isLogin ? (
                      <ArrowRight className="h-3.5 w-3.5 text-secondary-accent" />
                    ) : (
                      <ArrowLeft className="h-3.5 w-3.5 text-secondary-accent" />
                    )}
                  </button>
                </motion.div>
              </div>

              {/* Bottom Security / Privacy Proof */}
              <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-white/50">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-secondary-accent" />
                  <span>256-bit encrypted · Private family circle</span>
                </div>
                <span>© 2026 Parently</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ========================================================================= */}
        {/* MOBILE / SMALL SCREENS: Adaptive Single-Column View (lg:hidden)            */}
        {/* ========================================================================= */}
        <div className="lg:hidden flex flex-col p-6 sm:p-8">
          {/* Mobile Top Header Banner with Logo & Role Switcher */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <Link to="/login" className="inline-flex items-center gap-2 focus-visible:outline-none">
              <Logo size="sm" />
            </Link>

            <button
              type="button"
              onClick={toggleRole}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs font-semibold text-foreground shadow-soft-xs"
            >
              <span className={cn("h-2 w-2 rounded-full", isParent ? "bg-accent" : "bg-primary")} />
              <span>{isParent ? "Parent" : "Caregiver"}</span>
              <span className="text-[10px] text-muted-foreground">(Switch)</span>
            </button>
          </div>

          {/* Mobile Animated Segmented Switcher */}
          <div
            role="tablist"
            className="relative flex items-center rounded-full border border-border/70 bg-muted/60 dark:bg-muted/30 p-1 mb-6 shadow-inner"
          >
            <button
              type="button"
              role="tab"
              aria-selected={isLogin}
              onClick={() => handleModeSwitch("login")}
              className={cn(
                "relative z-10 flex-1 py-2 text-xs font-semibold rounded-full transition-colors duration-200 select-none text-center",
                isLogin ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isLogin && (
                <motion.div
                  layoutId="mobile-auth-tab-pill"
                  className="absolute inset-0 rounded-full bg-white dark:bg-slate-800 shadow-soft-xs border border-primary/15"
                  transition={{ type: "spring", stiffness: 420, damping: 30 }}
                />
              )}
              <span className="relative z-10">Sign In</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={!isLogin}
              onClick={() => handleModeSwitch("register")}
              className={cn(
                "relative z-10 flex-1 py-2 text-xs font-semibold rounded-full transition-colors duration-200 select-none text-center",
                !isLogin ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {!isLogin && (
                <motion.div
                  layoutId="mobile-auth-tab-pill"
                  className="absolute inset-0 rounded-full bg-white dark:bg-slate-800 shadow-soft-xs border border-primary/15"
                  transition={{ type: "spring", stiffness: 420, damping: 30 }}
                />
              )}
              <span className="relative z-10">Create Account</span>
            </button>
          </div>

          {/* Mobile Active Form Presentation */}
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="mobile-login"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="font-heading text-2xl font-semibold text-foreground">Welcome back</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Continue caring for the people who matter most.
                  </p>
                </div>

                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4" noValidate>
                  <div className="space-y-1">
                    <Label htmlFor="mobile-login-email" className="text-xs font-semibold">
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="mobile-login-email"
                        type="email"
                        placeholder="you@example.com"
                        className="h-11 rounded-xl pl-10"
                        autoComplete="email"
                        {...loginForm.register("email")}
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="mobile-login-password" className="text-xs font-semibold">
                        Password
                      </Label>
                      <Link to="/forgot-password" className="text-xs font-semibold text-primary">
                        Forgot?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="mobile-login-password"
                        type={loginShowPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="h-11 rounded-xl pl-10 pr-10"
                        autoComplete="current-password"
                        {...loginForm.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setLoginShowPassword((v) => !v)}
                        className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center text-muted-foreground"
                      >
                        {loginShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-xs text-destructive">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-gradient-primary text-white font-semibold"
                    disabled={loginSubmitting}
                  >
                    {loginSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {loginSubmitting ? "Signing in…" : "Sign in to Parently"}
                  </Button>
                </form>

                {/* Mobile Quick Demo Profiles */}
                <div className="pt-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 text-center">
                    Demo Profiles
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => fillDemo("alex@parently.app")}
                      className="rounded-xl border border-border/80 bg-background/70 p-2.5 text-left text-xs font-semibold"
                    >
                      <p className="text-primary font-bold">Alex (Offspring)</p>
                      <p className="text-[10px] text-muted-foreground truncate">alex@parently.app</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemo("carol@parently.app")}
                      className="rounded-xl border border-border/80 bg-background/70 p-2.5 text-left text-xs font-semibold"
                    >
                      <p className="text-accent font-bold">Carol (Parent)</p>
                      <p className="text-[10px] text-muted-foreground truncate">carol@parently.app</p>
                    </button>
                  </div>
                </div>

                {/* Mobile Bottom Switch Link */}
                <div className="pt-3 text-center text-xs text-muted-foreground">
                  <span>Don't have an account? </span>
                  <button
                    type="button"
                    onClick={() => handleModeSwitch("register")}
                    className="font-bold text-primary hover:underline"
                  >
                    Create an account
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="mobile-register"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3 }}
                className="space-y-3.5"
              >
                <div>
                  <h2 className="font-heading text-2xl font-semibold text-foreground">
                    {isParent ? "Join family circle" : "Create account"}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Bring your family's care and wellbeing together.
                  </p>
                </div>

                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-3" noValidate>
                  {!isParent && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">First name</Label>
                        <Input
                          placeholder="Alex"
                          className="h-10 rounded-xl"
                          {...registerForm.register("first_name")}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Last name</Label>
                        <Input
                          placeholder="Morgan"
                          className="h-10 rounded-xl"
                          {...registerForm.register("last_name")}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Email address</Label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      className="h-10 rounded-xl"
                      {...registerForm.register("email")}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Password</Label>
                      <Input
                        type="password"
                        placeholder="8+ chars"
                        className="h-10 rounded-xl text-xs"
                        {...registerForm.register("password")}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Confirm</Label>
                      <Input
                        type="password"
                        placeholder="Repeat"
                        className="h-10 rounded-xl text-xs"
                        {...registerForm.register("confirm_password")}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-gradient-primary text-white font-semibold mt-2"
                    disabled={registerSubmitting}
                  >
                    {registerSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {registerSubmitting ? "Creating…" : "Create account"}
                  </Button>
                </form>

                {/* Mobile Bottom Switch Link */}
                <div className="pt-3 text-center text-xs text-muted-foreground">
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => handleModeSwitch("login")}
                    className="font-bold text-primary hover:underline"
                  >
                    Sign in
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
