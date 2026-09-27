import { motion } from "framer-motion";
import { HeartPulse, Sparkles, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";

const highlights = [
  { icon: HeartPulse, title: "Daily check-ins", text: "Three gentle moments a day keep everyone in the loop." },
  { icon: Sparkles, title: "AI that understands", text: "Personalized insights built on your family's real data." },
  { icon: ShieldCheck, title: "Peace of mind", text: "Proactive alerts when something needs attention." },
  { icon: Users, title: "Family together", text: "Shared quizzes and memories that bring everyone closer." },
];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center p-4 sm:p-6 lg:p-10 bg-background bg-mesh-primary overflow-hidden">
      {/* Ambient background glows */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-secondary-accent/20 blur-3xl"
        aria-hidden="true"
      />

      {/* Floating Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[1020px] overflow-hidden rounded-[2rem] border border-white/70 dark:border-white/10 bg-card/85 dark:bg-slate-900/85 backdrop-blur-2xl shadow-[0_24px_64px_-12px_rgba(15,23,42,0.12),0_8px_24px_-4px_rgba(124,58,237,0.12)]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
          {/* LEFT: Care Panel */}
          <aside className="relative lg:col-span-5 flex flex-col justify-between overflow-hidden border-b border-white/10 lg:border-b-0 lg:border-r bg-slate-950 p-7 sm:p-9 lg:p-10 text-white">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(245_84%_58%_/_0.36),transparent_44%),radial-gradient(circle_at_80%_80%,hsl(152_70%_34%_/_0.22),transparent_40%)]"
              aria-hidden="true"
            />

            <div className="relative z-10">
              <Link
                to="/login"
                className="group inline-flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
              >
                <Logo
                  size="md"
                  className="[&_span]:text-white"
                  markClassName="bg-white/10 ring-1 ring-white/15 p-1 rounded-xl backdrop-blur-sm shadow-soft-sm"
                />
              </Link>
            </div>

            <div className="relative z-10 my-8">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-secondary-accent">
                Care, connected
              </p>
              <h1 className="font-heading text-2xl sm:text-3xl font-semibold leading-tight text-white tracking-[-0.03em]">
                Everyday care, made human.
              </h1>
              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-white/70">
                A calm, shared place for daily health checks, meaningful conversations, and reassurance.
              </p>

              <div className="mt-6 space-y-2.5">
                {highlights.slice(0, 3).map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.08 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-md"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-secondary-accent">
                      <item.icon className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white">{item.title}</p>
                      <p className="text-[11px] leading-relaxed text-white/60">{item.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative z-10 text-xs text-white/50 border-t border-white/10 pt-4">
              © 2026 Parently. Built for families.
            </div>
          </aside>

          {/* RIGHT: Content Section */}
          <main className="lg:col-span-7 flex flex-col justify-center p-6 sm:p-9 lg:p-10 bg-card/60 dark:bg-slate-900/60">
            <div className="w-full max-w-[440px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </motion.div>
    </div>
  );
}
