import { motion } from "framer-motion";
import { ArrowRight, Heart, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";

export function RoleSelectPage() {
  return (
    <AuthLayout>
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-primary ring-1 ring-inset ring-primary/10">
          Welcome to Parently
        </div>
        <h1 className="font-heading text-2xl font-semibold leading-tight text-foreground sm:text-[2rem]">How are you joining today?</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Choose your side of the care circle — we'll tailor everything from here.
        </p>
      </div>

      <div className="space-y-4">
        <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
          <Link
            to="/login?role=child"
            className="group flex items-center gap-4 rounded-xl border border-border/70 bg-card/90 p-5 text-left shadow-soft-sm transition-[color,background-color,border-color,box-shadow,transform] duration-200 hover:border-primary/30 hover:bg-card hover:shadow-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-base font-semibold text-foreground">Child / Caregiver</p>
              <p className="mt-0.5 text-sm text-muted-foreground">Set up or join a family circle and care for a parent.</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </Link>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
          <Link
            to="/login?role=parent"
            className="group flex items-center gap-4 rounded-xl border border-border/70 bg-card/90 p-5 text-left shadow-soft-sm transition-[color,background-color,border-color,box-shadow,transform] duration-200 hover:border-accent/30 hover:bg-card hover:shadow-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/15"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Heart className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-base font-semibold text-foreground">Parent</p>
              <p className="mt-0.5 text-sm text-muted-foreground">Received an invitation from your family? Join with the invited email.</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-accent" />
          </Link>
        </motion.div>
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already part of a family?{" "}
        <Link to="/login" className="font-bold text-primary hover:underline">
          Sign in here
        </Link>
      </p>
    </AuthLayout>
  );
}