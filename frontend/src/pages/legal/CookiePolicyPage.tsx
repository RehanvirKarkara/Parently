import { LegalLayout } from "./LegalLayout";
import { HardDrive, Lock, ShieldCheck } from "lucide-react";

export function CookiePolicyPage() {
  return (
    <LegalLayout
      title="Cookie & Local Storage Policy"
      badge="Storage Transparency"
      version="1.0"
      effectiveDate="September 27, 2026"
    >
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">1. Introduction</h2>
        <p>
          Parently believes in minimal, privacy-first data storage. We do not use third-party tracking pixels, advertising networks, or cross-site tracking cookies.
        </p>
        <p>
          This document describes how we use strictly necessary client-side storage technologies—specifically HTML5 LocalStorage—to maintain your authenticated session and deliver a consistent user interface.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-foreground font-bold text-xl">
          <HardDrive className="w-5 h-5 text-primary" />
          <h2>2. What We Store on Your Device</h2>
        </div>
        <p className="text-sm">
          All client-side storage used by Parently is strictly necessary for application functionality:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-border/60">
            <thead className="bg-muted/60 text-foreground font-semibold">
              <tr>
                <th className="p-2.5 border border-border/60">Key / Storage Name</th>
                <th className="p-2.5 border border-border/60">Storage Type</th>
                <th className="p-2.5 border border-border/60">Purpose</th>
                <th className="p-2.5 border border-border/60">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              <tr>
                <td className="p-2.5 border border-border/60 font-mono text-[11px]">parently.accessToken</td>
                <td className="p-2.5 border border-border/60">LocalStorage</td>
                <td className="p-2.5 border border-border/60">Short-lived JSON Web Token (JWT) securing authenticated API requests</td>
                <td className="p-2.5 border border-border/60">Session / Cleared on logout</td>
              </tr>
              <tr>
                <td className="p-2.5 border border-border/60 font-mono text-[11px]">parently.refreshToken</td>
                <td className="p-2.5 border border-border/60">LocalStorage</td>
                <td className="p-2.5 border border-border/60">Secure refresh token renewing expired access tokens without re-login</td>
                <td className="p-2.5 border border-border/60">30 days / Cleared on logout</td>
              </tr>
              <tr>
                <td className="p-2.5 border border-border/60 font-mono text-[11px]">parently_theme</td>
                <td className="p-2.5 border border-border/60">LocalStorage</td>
                <td className="p-2.5 border border-border/60">Remembers your preferred color mode (Light, Dark, or System)</td>
                <td className="p-2.5 border border-border/60">Persistent until cache cleared</td>
              </tr>
              <tr>
                <td className="p-2.5 border border-border/60 font-mono text-[11px]">parently-care-calendar-storage</td>
                <td className="p-2.5 border border-border/60">LocalStorage</td>
                <td className="p-2.5 border border-border/60">Stores local calendar filters and view preferences (month/week)</td>
                <td className="p-2.5 border border-border/60">Persistent until cache cleared</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-foreground font-bold text-xl">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <h2>3. Zero Third-Party Advertising Cookies</h2>
        </div>
        <p className="text-sm">
          Parently does not partner with ad brokers, social media tracking pixels (such as Meta Pixel or TikTok Tracker), or third-party behavioral profiling engines. Your browsing patterns inside Parently are never sold or shared with advertisers.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-foreground font-bold text-xl">
          <Lock className="w-5 h-5 text-primary" />
          <h2>4. Managing and Clearing Device Storage</h2>
        </div>
        <p className="text-sm">
          You can clear stored tokens and preferences at any time by clicking <strong>Sign Out</strong> in the top navigation or in Settings. Additionally, you may clear local browser storage via your browser&rsquo;s Developer Tools or Privacy & Settings menu.
        </p>
      </section>
    </LegalLayout>
  );
}
