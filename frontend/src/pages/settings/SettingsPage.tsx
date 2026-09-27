import { motion } from "framer-motion";
import { Bell, Database, KeyRound, Laptop, LogOut, Mail, Moon, ShieldCheck, Sun, User, UserRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { resetMockDb } from "@/api/mockDb";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ProfilePictureUpload } from "@/components/shared/ProfilePictureUpload";
import { Logo } from "@/components/shared/Logo";

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const updateUserAvatar = useAuthStore((s) => s.updateUserAvatar);
  const logout = useAuthStore((s) => s.logout);
  const setMode = useAuthStore((s) => s.setMode);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [prefs, setPrefs] = useState({
    pushAlerts: true,
    emailAlerts: true,
    missedCheckIn: true,
    weeklyReport: true,
    medicineReminders: true,
    legacyShared: true,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader className="mb-2" eyebrow="Account" title="Settings" description="Manage your profile, picture, theme, notifications, and account preferences." />

      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold"><User className="h-4 w-4 text-primary" /> Profile & Picture</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProfilePictureUpload
            first={user?.first_name}
            last={user?.last_name}
            avatarUrl={user?.avatar_url}
            color="brand"
            onAvatarChange={(newUrl) => updateUserAvatar(newUrl)}
          />
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
               <Label htmlFor="settings-first-name" className="font-medium">First name</Label>
               <Input id="settings-first-name" defaultValue={user?.first_name ?? ""} />
            </div>
            <div className="space-y-2">
               <Label htmlFor="settings-last-name" className="font-medium">Last name</Label>
               <Input id="settings-last-name" defaultValue={user?.last_name ?? ""} />
            </div>
          </div>
          <div className="space-y-2">
             <Label htmlFor="settings-email" className="font-medium">Email address</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
               <Input id="settings-email" defaultValue={user?.email ?? ""} className="pl-10" />
            </div>
          </div>
           <Button onClick={() => toast.success("Profile updated")}>Save changes</Button>
        </CardContent>
      </Card>

      {/* Theme selection card */}
      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold"><Sun className="h-4 w-4 text-primary" /> Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <button
               type="button"
               aria-pressed={theme === "light"}
               onClick={() => setTheme("light")}
              className={cn(
                "flex min-h-24 flex-col items-center justify-center gap-2.5 rounded-xl border p-4 text-center transition-[color,background-color,border-color,box-shadow] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
                theme === "light" ? "border-primary/25 bg-primary/8 text-primary shadow-soft-xs ring-1 ring-primary/10" : "border-border/70 bg-card/70 text-muted-foreground hover:border-primary/25 hover:bg-card hover:text-foreground",
              )}
            >
              <Sun className="h-5 w-5" />
              <span className="text-xs font-semibold">Light mode</span>
            </button>
            <button
               type="button"
               aria-pressed={theme === "dark"}
               onClick={() => setTheme("dark")}
              className={cn(
                "flex min-h-24 flex-col items-center justify-center gap-2.5 rounded-xl border p-4 text-center transition-[color,background-color,border-color,box-shadow] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
                theme === "dark" ? "border-primary/25 bg-primary/8 text-primary shadow-soft-xs ring-1 ring-primary/10" : "border-border/70 bg-card/70 text-muted-foreground hover:border-primary/25 hover:bg-card hover:text-foreground",
              )}
            >
              <Moon className="h-5 w-5" />
              <span className="text-xs font-semibold">Dark mode</span>
            </button>
            <button
               type="button"
               aria-pressed={theme === "system"}
               onClick={() => setTheme("system")}
              className={cn(
                "flex min-h-24 flex-col items-center justify-center gap-2.5 rounded-xl border p-4 text-center transition-[color,background-color,border-color,box-shadow] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
                theme === "system" ? "border-primary/25 bg-primary/8 text-primary shadow-soft-xs ring-1 ring-primary/10" : "border-border/70 bg-card/70 text-muted-foreground hover:border-primary/25 hover:bg-card hover:text-foreground",
              )}
            >
              <Laptop className="h-5 w-5" />
              <span className="text-xs font-semibold">System</span>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold"><Bell className="h-4 w-4 text-primary" /> Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <SettingRow title="Push notifications" description="Browser alerts for reminders and family updates" checked={prefs.pushAlerts} onChange={(v) => setPrefs({ ...prefs, pushAlerts: v })} />
          <Separator />
          <SettingRow title="Email alerts" description="Important updates sent to your inbox" checked={prefs.emailAlerts} onChange={(v) => setPrefs({ ...prefs, emailAlerts: v })} />
          <Separator />
          <SettingRow title="Missed check-in alerts" description="Get notified when a parent misses 2+ check-ins" checked={prefs.missedCheckIn} onChange={(v) => setPrefs({ ...prefs, missedCheckIn: v })} />
          <Separator />
          <SettingRow title="Medicine reminders" description="See upcoming doses for each parent" checked={prefs.medicineReminders} onChange={(v) => setPrefs({ ...prefs, medicineReminders: v })} />
          <Separator />
          <SettingRow title="Weekly report digest" description="Summary of the week's health data" checked={prefs.weeklyReport} onChange={(v) => setPrefs({ ...prefs, weeklyReport: v })} />
          <Separator />
          <SettingRow title="Legacy memories" description="When parents share new legacy answers" checked={prefs.legacyShared} onChange={(v) => setPrefs({ ...prefs, legacyShared: v })} />
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
             <Label htmlFor="settings-new-password" className="font-medium">New password</Label>
             <Input id="settings-new-password" type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
             <Label htmlFor="settings-confirm-password" className="font-medium">Confirm new password</Label>
             <Input id="settings-confirm-password" type="password" placeholder="••••••••" />
          </div>
          <Button variant="outline" onClick={() => toast.success("Password change requested — check your email for a code")}>
            <KeyRound className="h-4 w-4" /> Change password
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold"><UserRound className="h-4 w-4 text-primary" /> Role & demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-border/60 bg-muted/35 p-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-foreground">Try the parent experience</p>
              <p className="text-xs text-muted-foreground">See check-ins, health coach, and legacy questions as Carol would.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMode("parent");
                navigate("/parent");
              }}
            >
              Switch view
            </Button>
          </div>
           <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-warning/15 bg-warning/8 p-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-foreground">Reset demo data</p>
              <p className="text-xs text-muted-foreground">Restore the sample family data to its original state.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetMockDb();
                void queryClient.invalidateQueries();
                toast.success("Demo data has been reset");
              }}
            >
              <Database className="h-4 w-4" /> Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-destructive/15 bg-destructive/5 p-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-destructive">Sign out of Parently</p>
          <p className="text-xs text-muted-foreground">You can sign back in anytime.</p>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center gap-2 pb-6 pt-3">
        <Logo size="sm" withText={true} />
        <p className="text-center text-xs font-medium text-muted-foreground">
          Parently · {user?.email} · v1.0.0
        </p>
      </div>
    </div>
  );
}

function SettingRow({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.div whileTap={{ scale: 0.995 }} className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <Switch aria-label={title} checked={checked} onCheckedChange={onChange} />
    </motion.div>
  );
}
