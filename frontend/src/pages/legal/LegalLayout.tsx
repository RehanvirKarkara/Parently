import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Moon, Shield, Sun } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/stores/themeStore";
import { useAuthStore } from "@/stores/authStore";

interface LegalLayoutProps {
  title: string;
  badge: string;
  version: string;
  effectiveDate: string;
  children: React.ReactNode;
}

export function LegalLayout({
  title,
  badge,
  version,
  effectiveDate,
  children,
}: LegalLayoutProps) {
  const { theme, setTheme } = useThemeStore();
  const { mode } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { to: "/privacy-policy", label: "Privacy Policy" },
    { to: "/terms", label: "Terms of Service" },
    { to: "/medical-disclaimer", label: "Medical Disclaimer" },
    { to: "/ai-data-processing", label: "AI & Data Processing" },
    { to: "/cookie-policy", label: "Cookie Policy" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.history.length > 1) navigate(-1);
                else navigate(mode === "parent" ? "/parent" : "/");
              }}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="h-4 w-px bg-border/60" />
            <Link to="/" className="flex items-center gap-2">
              <Logo size="sm" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full w-9 h-9"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </Button>

            {mode ? (
              <Button asChild variant="outline" size="sm" className="rounded-full text-xs">
                <Link to={mode === "parent" ? "/parent" : "/settings"}>
                  {mode === "parent" ? "Parent Home" : "Settings"}
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm" className="rounded-full text-xs">
                <Link to="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation for policies */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex overflow-x-auto no-scrollbar gap-2 py-2 border-t border-border/20 text-xs">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full transition-colors font-medium ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
              <Shield className="w-3 h-3" />
              {badge}
            </span>
            <span>&bull;</span>
            <span>Version {version}</span>
            <span>&bull;</span>
            <span>Effective Date: {effectiveDate}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {title}
          </h1>
        </div>

        <div className="bg-card/70 border border-border/60 rounded-2xl shadow-soft backdrop-blur-md p-6 sm:p-10 space-y-8 text-foreground/90 leading-relaxed text-sm sm:text-base">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/20 py-8 text-center text-xs text-muted-foreground mt-12">
        <div className="max-w-5xl mx-auto px-4 space-y-2">
          <p>&copy; {new Date().getFullYear()} Parently. All rights reserved.</p>
          <p className="text-[11px] text-muted-foreground/80 max-w-xl mx-auto">
            This document outlines product terms, data practices, and disclosures. If you have questions regarding data privacy or consent, please contact{" "}
            <a href="mailto:privacy@parently.app" className="underline hover:text-foreground">
              privacy@parently.app
            </a>.
          </p>
        </div>
      </footer>
    </div>
  );
}
